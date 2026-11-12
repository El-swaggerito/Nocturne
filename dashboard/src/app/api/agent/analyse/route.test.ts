import { beforeEach, describe, expect, it, vi } from "vitest";

const analyseInvoiceMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/agent-inference-server", () => ({
  analyseInvoiceOnServer: analyseInvoiceMock,
}));

import { POST } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/agent/analyse", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agent/analyse", () => {
  beforeEach(() => {
    analyseInvoiceMock.mockReset();
  });

  it("rejects malformed input before invoking inference", async () => {
    for (const body of [
      {},
      { invoiceText: "" },
      { invoiceText: "invoice", policy: "disable guard" },
    ]) {
      const response = await POST(jsonRequest(body));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "invalid_request",
      });
    }

    expect(analyseInvoiceMock).not.toHaveBeenCalled();
  });

  it("returns only dashboard-safe fields from a verified proposal", async () => {
    analyseInvoiceMock.mockResolvedValue({
      ok: true,
      proposal: {
        recipient: "recipient.testnet",
        amountYoctoNear: "1250000000000000000000000",
        invoiceReference: "INV-TEE-001",
        supplierName: "Example Supplier",
        validationErrors: [],
      },
    });

    const response = await POST(
      jsonRequest({ invoiceText: "untrusted invoice contents" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      result: {
        status: "proposal",
        source: "near-ai-tee",
        proposal: {
          recipientId: "recipient.testnet",
          amountNear: "1.25",
          amountYocto: "1250000000000000000000000",
          invoiceReference: "INV-TEE-001",
        },
      },
    });

    expect(analyseInvoiceMock).toHaveBeenCalledTimes(1);
    expect(analyseInvoiceMock).toHaveBeenCalledWith(
      "untrusted invoice contents",
    );
  });

  it("returns a safe validation failure without leaking invoice data", async () => {
    analyseInvoiceMock.mockResolvedValue({
      ok: false,
      kind: "validation",
    });

    const response = await POST(
      jsonRequest({
        invoiceText: "SECRET-INVOICE malicious instructions",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({
      result: {
        status: "validation-error",
        source: "near-ai-tee",
        message:
          "Invoice failed deterministic or model-output validation.",
      },
    });
    expect(JSON.stringify(body)).not.toContain("SECRET-INVOICE");
  });

  it("fails closed when verified inference fails", async () => {
    analyseInvoiceMock.mockResolvedValue({
      ok: false,
      kind: "inference",
    });

    const response = await POST(
      jsonRequest({ invoiceText: "invoice" }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "verified_inference_failed",
    });
  });

  it("sanitises unexpected server failures", async () => {
    analyseInvoiceMock.mockRejectedValue(
      new Error("NEAR_AI_KEY=do-not-leak"),
    );

    const response = await POST(
      jsonRequest({ invoiceText: "invoice" }),
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "invoice_analysis_failed",
    });
    expect(JSON.stringify(body)).not.toContain("do-not-leak");
    expect(JSON.stringify(body)).not.toContain("NEAR_AI_KEY");
  });
});
