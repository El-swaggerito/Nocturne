export type PaymentStatus =
  | "confirmed"
  | "pending"
  | "policy-rejected"
  | "failed";

export type DemoPayment = {
  invoiceReference: string;
  recipient: string;
  amount: string;
  timestamp: string;
  status: PaymentStatus;
};

export const demoPayments: DemoPayment[] = [
  {
    invoiceReference: "INV-2026-089",
    recipient: "openai-billing.testnet",
    amount: "1.20 NEAR",
    timestamp: "Today, 14:22 UTC",
    status: "confirmed",
  },
  {
    invoiceReference: "INV-2026-088",
    recipient: "anthropic-invoicing.testnet",
    amount: "1.50 NEAR",
    timestamp: "Today, 11:05 UTC",
    status: "confirmed",
  },
  {
    invoiceReference: "INV-2026-087",
    recipient: "pinecone-vector.testnet",
    amount: "0.80 NEAR",
    timestamp: "Today, 09:14 UTC",
    status: "pending",
  },
  {
    invoiceReference: "INV-2026-086",
    recipient: "unknown-agent-99.near",
    amount: "8.50 NEAR",
    timestamp: "Yesterday, 18:40 UTC",
    status: "policy-rejected",
  },
  {
    invoiceReference: "INV-2026-085",
    recipient: "compute-cluster-4.testnet",
    amount: "2.10 NEAR",
    timestamp: "Yesterday, 16:12 UTC",
    status: "failed",
  },
];

export const overviewDemoData = {
  treasury: {
    balance: "24.50",
    spendable: "21.00",
    reserved: "3.50",
  },
  allowance: {
    committed: "3.50",
    remaining: "6.50",
    dailyLimit: "10.00",
    percentageUsed: 35,
    transactionLimit: "5.00",
    approvedRecipients: 4,
  },
  agent: {
    accountId: "agent-v1.nocturne.testnet",
  },
  proposal: {
    invoiceReference: "INV-2026-090",
    recipient: "aws-infra-compute.testnet",
    amount: "0.65 NEAR",
    aiValidation: "Invoice fields extracted",
    contractDecision: "Within current policy",
  },
};
