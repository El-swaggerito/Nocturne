import { afterEach, describe, expect, it, vi } from "vitest";

import {
  reconcileAgentPayment,
  submitAgentPayment,
  toAgentPaymentProposal,
} from "./payment-api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("payment API", () => {
  const proposal = {
    recipientId: "vendor.testnet",
    amountNear: "0.05",
    amountYocto: "50000000000000000000000",
    invoiceReference: "INV-38",
  };

  it("maps the dashboard proposal to the restricted agent schema", () => {
    expect(toAgentPaymentProposal(proposal)).toEqual({
      recipient: "vendor.testnet",
      amountYoctoNear: "50000000000000000000000",
      invoiceReference: "INV-38",
      validationErrors: [],
    });
  });

  it("submits through the server payment route", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          result: {
            status: "pending",
            requestId: "req_00000000000000000000000000000001",
            transactionHash: "test-hash",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const mapped = toAgentPaymentProposal(proposal);
    const result = await submitAgentPayment(mapped);

    expect(result.status).toBe("pending");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, init] = fetchMock.mock.calls[0];

    expect(JSON.parse(String(init?.body))).toEqual({
      action: "submit",
      proposal: mapped,
    });
  });

  it("reconciles without using the submit action", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          result: {
            status: "confirmed",
            requestId: "req_00000000000000000000000000000001",
            transactionHash: "test-hash",
            reason: "verified_contract_settlement",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const mapped = toAgentPaymentProposal(proposal);
    const result = await reconcileAgentPayment(mapped);

    expect(result.status).toBe("confirmed");

    const [, init] = fetchMock.mock.calls[0];

    expect(JSON.parse(String(init?.body))).toEqual({
      action: "reconcile",
      proposal: mapped,
    });
  });

  it("fails closed when the server rejects the request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ error: "payment_submission_failed" }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    await expect(
      submitAgentPayment(toAgentPaymentProposal(proposal)),
    ).rejects.toThrow("Agent payment request failed");
  });
});
