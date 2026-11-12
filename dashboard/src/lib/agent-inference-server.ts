import "server-only";

import {
  extractInvoiceProposal,
  InferenceError,
  InvoiceValidationError,
  type InvoiceProposal,
} from "@nocturne/agent";

export type ServerInvoiceAnalysis =
  | {
      ok: true;
      proposal: InvoiceProposal;
    }
  | {
      ok: false;
      kind: "validation" | "inference";
    };

export async function analyseInvoiceOnServer(
  invoiceText: string,
): Promise<ServerInvoiceAnalysis> {
  try {
    return {
      ok: true,
      proposal: await extractInvoiceProposal(invoiceText),
    };
  } catch (error) {
    if (error instanceof InvoiceValidationError) {
      return { ok: false, kind: "validation" };
    }

    if (error instanceof InferenceError) {
      return { ok: false, kind: "inference" };
    }

    throw error;
  }
}
