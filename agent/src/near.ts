import { invoiceProposalSchema, type InvoiceProposal } from "./types.js";
import type { KeyPairString } from "near-api-js";
import { type NearPaymentConfig } from "./config.js";
import { FilePaymentJournal, type PaymentRecord, type PaymentStatus } from "./payment-journal.js";

/** PROVISIONAL until Issue #6 agrees on the exact Rust JSON arguments. */
export interface RequestPaymentArgs {
  readonly request_id: string;
  readonly recipient_id: string;
  readonly amount_yocto: string;
  readonly invoice_reference: string;
}

export type PaymentResult =
  | { readonly status: "ai_rejected"; readonly reason: "invalid_invoice_proposal" }
  | (PaymentRecord & { readonly status: Exclude<PaymentStatus, "ai_rejected"> });

/** An intentionally narrow transport. There is NO generic method-call API here. */
export interface NearPaymentTransport {
  assertRestrictedKey(config: NearPaymentConfig): Promise<void>;
  sendPayment(config: NearPaymentConfig, args: RequestPaymentArgs): Promise<unknown>;
  readTransaction(config: NearPaymentConfig, txHash: string): Promise<unknown>;
  /** Optional trusted view method once Issue #6 defines the settlement schema. */
  readSettlement?(config: NearPaymentConfig, requestId: string): Promise<unknown>;
}

export class RestrictedKeyError extends Error {
  constructor(message = "Agent signing key is not restricted to request_payment on the Guard contract.") {
    super(message);
    this.name = "RestrictedKeyError";
  }
}

/** Reject FullAccess, wildcard (empty methods), wrong contract, and extra methods. */
export function assertFunctionCallPermission(permission: unknown, guardId: string): void {
  if (typeof permission !== "object" || permission === null || Array.isArray(permission)) {
    throw new RestrictedKeyError();
  }
  const data = permission as Record<string, unknown>;
  // The project specifies an ordinary FunctionCall key, not a GasKey or full-access key.
  const scope = data.FunctionCall;
  if (typeof scope !== "object" || scope === null || Array.isArray(scope)) {
    throw new RestrictedKeyError();
  }
  const access = scope as Record<string, unknown>;
  if (access.receiver_id !== guardId || !Array.isArray(access.method_names) ||
      access.method_names.length !== 1 || access.method_names[0] !== "request_payment") {
    throw new RestrictedKeyError();
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasFailure = (value: unknown): boolean => isObject(value) && "Failure" in value;
const hasSuccess = (value: unknown): boolean => isObject(value) && "SuccessValue" in value;

/** A successful request transaction is not proof that the async payout settled. */
export function interpretChainResult(raw: unknown): {
  readonly status: "contract_rejected" | "pending";
  readonly transactionHash?: string;
  readonly chainFinality?: string;
  readonly reason?: string;
} {
  if (!isObject(raw)) return { status: "pending", reason: "unverified_chain_result" };
  const tx = isObject(raw.transaction) ? raw.transaction : undefined;
  const transactionHash = typeof tx?.hash === "string" ? tx.hash : undefined;
  const chainFinality = typeof raw.final_execution_status === "string" ? raw.final_execution_status : undefined;
  const facts = {
    ...(transactionHash ? { transactionHash } : {}),
    ...(chainFinality ? { chainFinality } : {}),
  };
  // Failure of a receipt can be a failed transfer handled by the callback.
  // Only an explicit top-level transaction outcome failure is labelled rejected.
  if (hasFailure(raw.status)) {
    return { status: "contract_rejected", ...facts, reason: "chain_execution_failure" };
  }
  if (!hasSuccess(raw.status) || chainFinality !== "FINAL") {
    return { status: "pending", ...facts, reason: "not_final_or_unknown" };
  }
  return { status: "pending", ...facts, reason: "awaiting_contract_settlement" };
}

export function toPaymentArgs(proposal: InvoiceProposal, requestId: string): RequestPaymentArgs {
  return {
    request_id: requestId,
    recipient_id: proposal.recipient,
    amount_yocto: proposal.amountYoctoNear,
    invoice_reference: proposal.invoiceReference,
  };
}

/**
 * Fail-closed, single-attempt client: a timeout may mean the transaction ran.
 * A later invocation reads the persisted status but NEVER broadcasts again.
 * 'confirmed' is only possible when a future Issue #6 contract getter is
 * introduced and independently verifies the settled payment.
 */
export class NearPaymentClient {
  constructor(
    private readonly config: NearPaymentConfig,
    private readonly transport: NearPaymentTransport,
    private readonly journal: FilePaymentJournal = new FilePaymentJournal(config.journalDir),
  ) {}

  async submit(proposal: unknown): Promise<PaymentResult> {
    const checked = invoiceProposalSchema.safeParse(proposal);
    if (!checked.success) return { status: "ai_rejected", reason: "invalid_invoice_proposal" };
    const { record, file } = await this.journal.reserve(
      checked.data, this.config.network, this.config.contractId, this.config.agentId,
    );
    const current = await this.journal.current(file);
    if (current.status !== "prepared") return current;
    if (!this.config.enableTestnetWrites || !this.config.contractInterfaceApproved) {
      return { ...current, reason: "testnet_submissions_disabled_until_contract_review" };
    }

    // Query chain permissions on the actual public key BEFORE any broadcast.
    try {
      await this.transport.assertRestrictedKey(this.config);
    } catch (error) {
      if (error instanceof RestrictedKeyError) throw error;
      // Provider errors can contain request headers. Do not expose raw details.
      throw new RestrictedKeyError("Unable to verify the restricted agent key; no transaction was sent.");
    }
    if (!await this.journal.claimAttempt(file)) return this.journal.current(file);
    const attempted: PaymentRecord = { ...record, status: "pending", reason: "attempt_outcome_unknown" };
    await this.journal.update(file, attempted);
    try {
      const outcome = interpretChainResult(await this.transport.sendPayment(
        this.config, toPaymentArgs(checked.data, record.requestId),
      ));
      const next: PaymentRecord = { ...record, ...outcome };
      await this.journal.update(file, next);
      return next;
    } catch (error) {
      // The SDK may throw after broadcasting. Never reuse a new request ID.
      // Only read structured, non-secret transaction metadata if available.
      const e = isObject(error) ? error : {};
      const txHash = typeof e.txHash === "string" ? e.txHash : undefined;
      const outcome = e.transactionResult === undefined ? undefined : interpretChainResult(e.transactionResult);
      const next: PaymentRecord = {
        ...attempted,
        ...(outcome ?? {}),
        ...(txHash ? { transactionHash: txHash } : {}),
      };
      await this.journal.update(file, next);
      return next;
    }
  }

  /** Read-only status refresh. Never triggers another request_payment call. */
  async reconcile(proposal: unknown): Promise<PaymentResult> {
    const checked = invoiceProposalSchema.safeParse(proposal);
    if (!checked.success) return { status: "ai_rejected", reason: "invalid_invoice_proposal" };
    const { file } = await this.journal.reserve(
      checked.data, this.config.network, this.config.contractId, this.config.agentId,
    );
    const current = await this.journal.current(file);
    if (!current.transactionHash || current.status === "contract_rejected" || current.status === "confirmed") return current;
    try {
      const chain = await this.transport.readTransaction(this.config, current.transactionHash);
      if (!isObject(chain) || !isObject(chain.transaction) ||
          chain.transaction.hash !== current.transactionHash) return current;
      const outcome = interpretChainResult(chain);
      let updated: PaymentRecord = { ...current, ...outcome };
      if (outcome.reason === "awaiting_contract_settlement" && this.transport.readSettlement) {
        try {
          const settled = await this.transport.readSettlement(this.config, current.requestId);
          if (isObject(settled) && settled.status === "confirmed" &&
              settled.request_id === current.requestId &&
              settled.recipient_id === checked.data.recipient &&
              settled.amount_yocto === checked.data.amountYoctoNear) {
            updated = { ...updated, status: "confirmed", reason: "verified_contract_settlement" };
          }
        } catch {
          // Contract status view may not be deployed yet. Keep transaction pending.
        }
      }
      await this.journal.update(file, updated);
      return updated;
    } catch {
      return current;
    }
  }
}

/** Only testnet; refuses to broadcast with a FullAccess or wrong-method key. */
export function createNearTestnetTransport(): NearPaymentTransport {
  async function sdk(config: NearPaymentConfig) {
    const near = await import("near-api-js");
    const provider = new near.JsonRpcProvider({ url: config.rpcUrl });
    const secret = config.agentSecretKey as KeyPairString;
    const account = new near.Account(config.agentId, provider, secret);
    return { near, provider, account, secret };
  }
  return {
    async assertRestrictedKey(config) {
      const { near, account, secret } = await sdk(config);
      const publicKey = near.KeyPair.fromString(secret).getPublicKey().toString();
      const key = await account.getAccessKey(publicKey);
      assertFunctionCallPermission(key.permission, config.contractId);
    },
    async sendPayment(config, args) {
      const { account } = await sdk(config);
      return account.callFunctionRaw({
        contractId: config.contractId,
        methodName: "request_payment",
        args: { ...args },
        gas: 100_000_000_000_000n,
        deposit: 0n,
        waitUntil: "FINAL",
      });
    },
    async readSettlement(config, requestId) {
      // PROVISIONAL read-only getter, to be aligned with the #6 Guard API.
      // No signing action is sent by this call.
      const { provider } = await sdk(config);
      return provider.callFunction({
        contractId: config.contractId,
        method: "get_payment",
        args: { request_id: requestId },
      });
    },
    async readTransaction(config, txHash) {
      // This is read-only: get transaction status by known hash and signer.
      const response = await fetch(config.rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: "nocturne-tx-status", method: "tx",
          params: { tx_hash: txHash, sender_account_id: config.agentId, wait_until: "FINAL" },
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error("Cannot read transaction status");
      const body: unknown = await response.json();
      if (!isObject(body) || "error" in body || !isObject(body.result)) throw new Error("No confirmed RPC outcome");
      return body.result;
    },
  };
}
