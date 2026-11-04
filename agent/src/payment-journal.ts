import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { InvoiceProposal } from "./types.js";

/** Never contains keys or raw invoice text. The journal directory must be persistent. */
export type PaymentStatus = "prepared" | "ai_rejected" | "contract_rejected" | "pending" | "confirmed";

export interface PaymentRecord {
  readonly requestId: string;
  readonly fingerprint: string;
  readonly status: Exclude<PaymentStatus, "ai_rejected">;
  readonly transactionHash?: string;
  readonly chainFinality?: string;
  readonly reason?: string;
}

export class PaymentJournalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentJournalError";
  }
}

const hexHash = (value: string): string => createHash("sha256").update(value).digest("hex");

/**
 * Uses one file per (network, contract, agent, invoice reference). Creating
 * that file with 'wx' makes a competing first reservation fail atomically.
 * One persistent 'attempt' marker permits at most one broadcast from this
 * journal, even if the process crashes or RPC times out.
 */
export class FilePaymentJournal {
  constructor(private readonly directory: string) {}

  private location(network: string, contractId: string, agentId: string, reference: string): string {
    const key = hexHash(JSON.stringify([network, contractId, agentId, reference]));
    return join(this.directory, `${key}.json`);
  }

  private fingerprint(proposal: InvoiceProposal): string {
    return hexHash(JSON.stringify([
      proposal.recipient,
      proposal.amountYoctoNear,
      proposal.invoiceReference,
    ]));
  }

  private async initialise(): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
  }

  private async load(file: string): Promise<PaymentRecord> {
    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(file, "utf8"));
    } catch {
      throw new PaymentJournalError("Payment journal is unavailable or corrupted; manual reconciliation is required.");
    }
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      throw new PaymentJournalError("Payment journal is corrupted; no submission was made.");
    }
    const data = raw as Record<string, unknown>;
    if (typeof data.requestId !== "string" || typeof data.fingerprint !== "string" ||
      !["prepared", "contract_rejected", "pending", "confirmed"].includes(String(data.status))) {
      throw new PaymentJournalError("Payment journal is corrupted; no submission was made.");
    }
    return data as unknown as PaymentRecord;
  }

  async reserve(proposal: InvoiceProposal, network: string, contractId: string, agentId: string): Promise<{ record: PaymentRecord; file: string }> {
    await this.initialise();
    const file = this.location(network, contractId, agentId, proposal.invoiceReference);
    const fingerprint = this.fingerprint(proposal);
    const initial: PaymentRecord = {
      requestId: `req_${hexHash(JSON.stringify([network, contractId, agentId, proposal.invoiceReference])).slice(0, 32)}`,
      fingerprint,
      status: "prepared",
    };
    try {
      const handle = await open(file, "wx", 0o600);
      try {
        await handle.writeFile(JSON.stringify(initial));
        await handle.sync();
      } finally {
        await handle.close();
      }
      return { record: initial, file };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const previous = await this.load(file);
    if (previous.fingerprint !== fingerprint) {
      throw new PaymentJournalError("Invoice reference already reserved with different payment details.");
    }
    return { record: previous, file };
  }

  async hasAttempted(file: string): Promise<boolean> {
    try {
      await readFile(`${file}.attempt`);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    }
  }

  /** Persist attempt BEFORE sending. Never remove this marker after a timeout. */
  async claimAttempt(file: string): Promise<boolean> {
    try {
      const handle = await open(`${file}.attempt`, "wx", 0o600);
      try {
        await handle.writeFile("attempted\n");
        await handle.sync();
      } finally {
        await handle.close();
      }
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
      throw error;
    }
  }

  /** Atomic replacement prevents partial status writes after a complete reservation. */
  async update(file: string, record: PaymentRecord): Promise<void> {
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(record), { mode: 0o600, flag: "wx" });
    await rename(temp, file);
  }

  async current(file: string): Promise<PaymentRecord> {
    const record = await this.load(file);
    if (record.status === "prepared" && await this.hasAttempted(file)) {
      return { ...record, status: "pending", reason: "attempt_outcome_unknown" };
    }
    return record;
  }
}
