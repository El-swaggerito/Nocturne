import { NextResponse } from "next/server";

import { analyseInvoiceOnServer } from "@/lib/agent-inference-server";
import { formatYoctoNear } from "../../../../lib/format-near";

const MAX_INVOICE_LENGTH = 16_000;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400 },
    );
  }

  const keys = Object.keys(body);

  if (
    keys.length !== 1 ||
    !("invoiceText" in body) ||
    typeof body.invoiceText !== "string"
  ) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400 },
    );
  }

  const invoiceText = body.invoiceText;

  if (
    !invoiceText.trim() ||
    invoiceText.length > MAX_INVOICE_LENGTH
  ) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400 },
    );
  }

  try {
    const analysis = await analyseInvoiceOnServer(invoiceText);

    if (!analysis.ok) {
      if (analysis.kind === "validation") {
        return NextResponse.json(
          {
            result: {
              status: "validation-error",
              source: "near-ai-tee",
              message:
                "Invoice failed deterministic or model-output validation.",
            },
          },
          { status: 422 },
        );
      }

      return NextResponse.json(
        { error: "verified_inference_failed" },
        { status: 502 },
      );
    }

    const proposal = analysis.proposal;

    return NextResponse.json({
      result: {
        status: "proposal",
        source: "near-ai-tee",
        proposal: {
          recipientId: proposal.recipient,
          amountNear: formatYoctoNear(
            proposal.amountYoctoNear,
            24,
          ),
          amountYocto: proposal.amountYoctoNear,
          invoiceReference: proposal.invoiceReference,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: "invoice_analysis_failed" },
      { status: 500 },
    );
  }
}
