export type InvoiceProposal = {
  recipientId: string;
  amountNear: string;
  amountYocto: string;
  invoiceReference: string;
};

export type InvoiceAnalysisResult =
  | {
      status: "proposal";
      source: "near-ai-tee";
      proposal: InvoiceProposal;
    }
  | {
      status: "validation-error";
      source: "near-ai-tee";
      message: string;
    };

type AnalyseApiResponse =
  | { result: InvoiceAnalysisResult }
  | {
      error:
        | "invalid_request"
        | "verified_inference_failed"
        | "invoice_analysis_failed";
    };

export async function analyseInvoice(
  invoiceText: string,
): Promise<InvoiceAnalysisResult> {
  const response = await fetch("/api/agent/analyse", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ invoiceText }),
  });

  let body: AnalyseApiResponse;

  try {
    body = (await response.json()) as AnalyseApiResponse;
  } catch {
    throw new Error("Invoice analysis returned an invalid response");
  }

  if ("result" in body) {
    return body.result;
  }

  if (body.error === "verified_inference_failed") {
    throw new Error("Verified NEAR AI inference failed");
  }

  throw new Error("Invoice analysis failed");
}
