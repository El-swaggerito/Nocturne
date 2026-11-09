import { parseNearToYoctoNear } from "./format-near";
import { isValidNearAccountId } from "./near-account";

export type InvoiceProposal = {
  recipientId: string;
  amountNear: string;
  amountYocto: string;
  invoiceReference: string;
};

export type InvoiceAnalysisResult =
  | {
      status: "proposal";
      source: "demo-adapter";
      proposal: InvoiceProposal;
    }
  | {
      status: "validation-error";
      source: "demo-adapter";
      message: string;
    };

export type InvoiceAgent = {
  analyseInvoice(invoiceText: string): Promise<InvoiceAnalysisResult>;
};

function findField(
  invoiceText: string,
  pattern: RegExp,
): string | null {
  const match = invoiceText.match(pattern);
  return match?.[1]?.trim() ?? null;
}

export const demoInvoiceAgent: InvoiceAgent = {
  async analyseInvoice(invoiceText) {
    const text = invoiceText.trim();

    if (!text) {
      return {
        status: "validation-error",
        source: "demo-adapter",
        message: "Invoice text is required",
      };
    }

    const recipientId = findField(
      text,
      /^RECIPIENT_ACCOUNT:\s*([^\s]+)$/im,
    );

    const invoiceReference = findField(
      text,
      /^INVOICE:\s*([^\s]+)$/im,
    );

    const amountNear =
      findField(
        text,
        /^TOTAL DUE:\s*([0-9]+(?:\.[0-9]+)?)\s+NEAR$/im,
      ) ??
      findField(
        text,
        /^AMOUNT:\s*([0-9]+(?:\.[0-9]+)?)\s+NEAR$/im,
      );

    if (!recipientId) {
      return {
        status: "validation-error",
        source: "demo-adapter",
        message: "Invoice recipient could not be extracted",
      };
    }

    if (!isValidNearAccountId(recipientId)) {
      return {
        status: "validation-error",
        source: "demo-adapter",
        message: "Invoice contains an invalid NEAR recipient",
      };
    }

    if (!invoiceReference) {
      return {
        status: "validation-error",
        source: "demo-adapter",
        message: "Invoice reference could not be extracted",
      };
    }

    if (!amountNear) {
      return {
        status: "validation-error",
        source: "demo-adapter",
        message: "A NEAR amount could not be extracted",
      };
    }

    try {
      const amountYocto =
        parseNearToYoctoNear(amountNear);

      return {
        status: "proposal",
        source: "demo-adapter",
        proposal: {
          recipientId,
          amountNear,
          amountYocto,
          invoiceReference,
        },
      };
    } catch {
      return {
        status: "validation-error",
        source: "demo-adapter",
        message: "Invoice contains an invalid NEAR amount",
      };
    }
  },
};
