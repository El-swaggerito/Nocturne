import { beforeEach, describe, expect, it, vi } from "vitest";

const submitMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/agent-server", () => ({
  createServerPaymentClient: () => ({
    submit: submitMock,
  }),
}));

import { POST } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/agent/payment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agent/payment", () => {
  beforeEach(() => {
    submitMock.mockReset();
  });

  it("rejects a request without a proposal before creating a payment", async () => {
    const response = await POST(jsonRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "invalid_request" });
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("passes only the proposal to the server-side payment client", async () => {
    const proposal = {
      recipient: "recipient.testnet",
      amountYoctoNear: "10000000000000000000000",
      invoiceReference: "invoice-38",
      currency: "NEAR",
    };

    const paymentResult = {
      status: "pending",
      requestId: "req_00000000000000000000000000000001",
      transactionHash: "example-test-hash",
      reason: "awaiting_contract_settlement",
    };

    submitMock.mockResolvedValue(paymentResult);

    const response = await POST(jsonRequest({
      proposal,
      ignoredUntrustedField: "set_limits",
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: paymentResult });
    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitMock).toHaveBeenCalledWith(proposal);
  });

  it("rejects malformed JSON without touching the payment client", async () => {
    const request = new Request("http://localhost/api/agent/payment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("returns a sanitised error when the server payment client throws", async () => {
    submitMock.mockRejectedValue(
      new Error("secret provider detail NEAR_AGENT_PRIVATE_KEY=do-not-leak"),
    );

    const response = await POST(jsonRequest({
      proposal: {
        recipient: "recipient.testnet",
        amountYoctoNear: "10000000000000000000000",
        invoiceReference: "invoice-38",
        currency: "NEAR",
      },
    }));

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "payment_submission_failed" });
    expect(JSON.stringify(body)).not.toContain("NEAR_AGENT_PRIVATE_KEY");
    expect(JSON.stringify(body)).not.toContain("do-not-leak");
  });
});
