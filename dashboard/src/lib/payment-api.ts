import type { InvoiceProposal } from "./agent-api";

export type AgentPaymentProposal = {
  recipient: string;
  amountYoctoNear: string;
  invoiceReference: string;
  validationErrors: [];
};

export type AgentPaymentResult = {
  status: string;
  requestId?: string;
  transactionHash?: string;
  reason?: string;
};

type PaymentAction = "submit" | "reconcile";

type PaymentApiResponse = {
  result: AgentPaymentResult;
};

export function toAgentPaymentProposal(
  proposal: InvoiceProposal,
): AgentPaymentProposal {
  return {
    recipient: proposal.recipientId,
    amountYoctoNear: proposal.amountYocto,
    invoiceReference: proposal.invoiceReference,
    validationErrors: [],
  };
}

async function requestPayment(
  action: PaymentAction,
  proposal: AgentPaymentProposal,
): Promise<AgentPaymentResult> {
  const response = await fetch("/api/agent/payment", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action,
      proposal,
    }),
  });

  const body: unknown = await response.json();

  if (
    !response.ok ||
    typeof body !== "object" ||
    body === null ||
    !("result" in body)
  ) {
    throw new Error("Agent payment request failed");
  }

  return (body as PaymentApiResponse).result;
}

export function submitAgentPayment(
  proposal: AgentPaymentProposal,
): Promise<AgentPaymentResult> {
  return requestPayment("submit", proposal);
}

export function reconcileAgentPayment(
  proposal: AgentPaymentProposal,
): Promise<AgentPaymentResult> {
  return requestPayment("reconcile", proposal);
}
