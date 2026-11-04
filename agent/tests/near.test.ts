import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadNearPaymentConfig, ConfigurationError, NEAR_TESTNET_RPC_URL,
  type NearPaymentConfig,
} from "../src/config.js";
import {
  assertFunctionCallPermission, interpretChainResult, NearPaymentClient,
  type NearPaymentTransport, RestrictedKeyError,
} from "../src/near.js";
import { FilePaymentJournal, PaymentJournalError } from "../src/payment-journal.js";
import type { InvoiceProposal } from "../src/types.js";

const validProposal: InvoiceProposal = {
  recipient: "merchant.testnet",
  amountYoctoNear: "1500000000000000000000000",
  invoiceReference: "INV-2026-0001",
  supplierName: "Fictional Supplier",
  validationErrors: [],
};

function config(path: string, enableTestnetWrites = false): NearPaymentConfig {
  return {
    network: "testnet", rpcUrl: NEAR_TESTNET_RPC_URL,
    agentId: "agent.testnet", contractId: "guard.testnet",
    agentSecretKey: "fictional-key-never-used-by-mock",
    journalDir: path,
    enableTestnetWrites,
    contractInterfaceApproved: enableTestnetWrites,
  };
}

function mockTransport(overrides: Partial<NearPaymentTransport> = {}): NearPaymentTransport {
  return {
    async assertRestrictedKey() {},
    async sendPayment() { return { transaction: { hash: "fictional-tx-hash" }, final_execution_status: "FINAL", status: { SuccessValue: "" } }; },
    async readTransaction() { return { transaction: { hash: "fictional-tx-hash" }, final_execution_status: "FINAL", status: { SuccessValue: "" } }; },
    ...overrides,
  };
}

async function withTemp(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "nocturne-issue10-"));
  try { await run(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}

test("access key verification rejects FullAccess, wrong contract and extra/wildcard methods", () => {
  assertFunctionCallPermission({ FunctionCall: { receiver_id: "guard.testnet", method_names: ["request_payment"] } }, "guard.testnet");
  for (const invalid of [
    "FullAccess",
    { GasKeyFullAccess: {} },
    { FunctionCall: { receiver_id: "evil.testnet", method_names: ["request_payment"] } },
    { FunctionCall: { receiver_id: "guard.testnet", method_names: [] } },
    { FunctionCall: { receiver_id: "guard.testnet", method_names: ["request_payment", "set_limits"] } },
    { FunctionCall: { receiver_id: "guard.testnet", method_names: ["set_frozen"] } },
  ]) assert.throws(() => assertFunctionCallPermission(invalid, "guard.testnet"), RestrictedKeyError);
});

test("configuration is pinned to testnet and fails without a dedicated agent signing key", () => {
  assert.throws(() => loadNearPaymentConfig({ NEAR_GUARD_ACCOUNT_ID: "guard.testnet", NEAR_AGENT_ACCOUNT_ID: "agent.testnet" }), ConfigurationError);
  assert.throws(() => loadNearPaymentConfig({ NEAR_GUARD_ACCOUNT_ID: "guard.testnet", NEAR_AGENT_ACCOUNT_ID: "agent.testnet", NEAR_AGENT_PRIVATE_KEY: "ed25519:" }), ConfigurationError);
  const loaded = loadNearPaymentConfig({
    NEAR_NETWORK: "testnet", NEAR_GUARD_ACCOUNT_ID: "guard.testnet", NEAR_AGENT_ACCOUNT_ID: "agent.testnet",
    NEAR_AGENT_PRIVATE_KEY: `ed25519:${"x".repeat(42)}`, NEAR_RPC_URL: "https://evil.example",
  });
  assert.equal(loaded.rpcUrl, NEAR_TESTNET_RPC_URL);
  assert.equal(loaded.enableTestnetWrites, false);
  assert.equal(loaded.contractInterfaceApproved, false);
  assert.equal(loaded.network, "testnet");
});

test("invalid AI proposal fails before touching journal, access key or network", async () => withTemp(async (dir) => {
  let calls = 0;
  const client = new NearPaymentClient(config(dir, true), mockTransport({
    async assertRestrictedKey() { calls++; },
    async sendPayment() { calls++; throw new Error("Must not be called"); },
  }));
  const result = await client.submit({ ...validProposal, amountYoctoNear: "1.5", admin: true });
  assert.equal(result.status, "ai_rejected");
  assert.equal(calls, 0);
}));

test("default mode prepares durable ID but refuses all testnet broadcasts", async () => withTemp(async (dir) => {
  const client = new NearPaymentClient(config(dir), mockTransport({
    async sendPayment() { throw new Error("Unexpected live broadcast"); },
  }));
  const a = await client.submit(validProposal);
  const b = await client.submit(validProposal);
  assert.equal(a.status, "prepared");
  assert.equal(b.status, "prepared");
  assert.equal(a.requestId, b.requestId);
}));

test("one restricted request_payment call uses exact arguments and saves transaction hash", async () => withTemp(async (dir) => {
  let calls = 0;
  let checked = 0;
  const transport = mockTransport({
    async assertRestrictedKey() { checked++; },
    async sendPayment(c, args) {
      calls++;
      assert.equal(c.contractId, "guard.testnet");
      assert.deepEqual(Object.keys(args).sort(), ["amount_yocto", "invoice_reference", "recipient_id", "request_id"]);
      assert.equal(args.amount_yocto, validProposal.amountYoctoNear);
      assert.equal(args.recipient_id, validProposal.recipient);
      assert.match(args.request_id, /^req_[0-9a-f]{32}$/);
      return { transaction: { hash: "fictional-tx-hash" }, final_execution_status: "FINAL", status: { SuccessValue: "" } };
    },
  });
  const first = await new NearPaymentClient(config(dir, true), transport).submit(validProposal);
  const repeat = await new NearPaymentClient(config(dir, true), transport).submit(validProposal);
  assert.equal(first.status, "pending");
  assert.equal(first.transactionHash, "fictional-tx-hash");
  assert.equal(repeat.status, "pending");
  assert.equal(repeat.requestId, first.requestId);
  assert.equal(checked, 1);
  assert.equal(calls, 1);
}));

test("timeout after sending remains pending on restart and is never resent", async () => withTemp(async (dir) => {
  let calls = 0;
  const transport = mockTransport({
    async sendPayment() { calls++; throw new Error("Unknown RPC timeout containing fictional secret"); },
  });
  const a = await new NearPaymentClient(config(dir, true), transport).submit(validProposal);
  const b = await new NearPaymentClient(config(dir, true), transport).submit(validProposal);
  assert.equal(a.status, "pending");
  assert.equal(b.status, "pending");
  assert.equal(a.requestId, b.requestId);
  assert.equal(calls, 1);
  assert.equal(JSON.stringify(b).includes("secret"), false);
}));

test("same reference cannot be reused for a changed recipient or amount", async () => withTemp(async (dir) => {
  const client = new NearPaymentClient(config(dir), mockTransport());
  await client.submit(validProposal);
  await assert.rejects(client.submit({ ...validProposal, recipient: "attacker.testnet" }), PaymentJournalError);
  await assert.rejects(client.submit({ ...validProposal, amountYoctoNear: "1000000000000000000000000" }), PaymentJournalError);
}));

test("chain failure is contract_rejected; even FINAL success is NOT paid/confirmed", () => {
  assert.equal(interpretChainResult({ status: { Failure: {} }, final_execution_status: "FINAL" }).status, "contract_rejected");
  assert.deepEqual(interpretChainResult({ status: { SuccessValue: "" }, final_execution_status: "FINAL", transaction: { hash: "tx" } }), {
    status: "pending", transactionHash: "tx", chainFinality: "FINAL", reason: "awaiting_contract_settlement",
  });
});

test("read-only reconciliation can confirm only with matching contract settlement data", async () => withTemp(async (dir) => {
  let sent = 0;
  let settlementId = "";
  const transport = mockTransport({
    async sendPayment() { sent++; return { transaction: { hash: "fictional-tx-hash" }, final_execution_status: "FINAL", status: { SuccessValue: "" } }; },
    async readSettlement(_c, id) { settlementId = id; return { request_id: id, recipient_id: validProposal.recipient, amount_yocto: validProposal.amountYoctoNear, status: "confirmed" }; },
  });
  const client = new NearPaymentClient(config(dir, true), transport);
  const submitted = await client.submit(validProposal);
  assert.equal(submitted.status, "pending");
  const settled = await client.reconcile(validProposal);
  assert.equal(settled.status, "confirmed");
  assert.equal(settlementId, submitted.requestId);
  assert.equal(sent, 1);
}));

test("corrupt journal prevents submission instead of silently generating new ID", async () => withTemp(async (dir) => {
  const journal = new FilePaymentJournal(dir);
  const proposal = validProposal;
  const { file } = await journal.reserve(proposal, "testnet", "guard.testnet", "agent.testnet");
  const { writeFile } = await import("node:fs/promises");
  await writeFile(file, "broken-json");
  await assert.rejects(new NearPaymentClient(config(dir, true), mockTransport()).submit(proposal), PaymentJournalError);
  assert.equal(await readFile(file, "utf8"), "broken-json");
}));

test("restricted-key verification failure cannot submit or leak provider errors", async () => withTemp(async (dir) => {
  let broadcasts = 0;
  const client = new NearPaymentClient(config(dir, true), mockTransport({
    async assertRestrictedKey() { throw new Error("secret-from-an-upstream-error"); },
    async sendPayment() { broadcasts++; throw new Error("Should not send"); },
  }));
  await assert.rejects(
    client.submit(validProposal),
    (error: unknown) => error instanceof RestrictedKeyError && !error.message.includes("secret"),
  );
  assert.equal(broadcasts, 0);
}));

test("a mismatched contract settlement cannot falsely confirm payment", async () => withTemp(async (dir) => {
  const client = new NearPaymentClient(config(dir, true), mockTransport({
    async readSettlement(_c, requestId) {
      return { request_id: requestId, recipient_id: "attacker.testnet", amount_yocto: validProposal.amountYoctoNear, status: "confirmed" };
    },
  }));
  const submitted = await client.submit(validProposal);
  assert.equal(submitted.status, "pending");
  const refreshed = await client.reconcile(validProposal);
  assert.equal(refreshed.status, "pending");
}));
