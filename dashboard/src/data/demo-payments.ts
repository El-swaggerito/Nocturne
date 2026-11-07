export type PaymentRecordStatus =
  | "confirmed"
  | "pending"
  | "failed";

export type PaymentUiStatus =
  | PaymentRecordStatus
  | "policy-rejected";

export type PaymentSource =
  | "contract"
  | "agent-failure";

export type DemoPaymentRecord = {
  requestId: string;
  invoiceReference: string;
  label: string;
  recipient: string;
  amountNear: string;
  amountYocto: string;
  requestedAt: string;
  utcDay: string;
  status: PaymentUiStatus;
  source: PaymentSource;
  transactionHash?: string;
  rejectionReason?: string;
};

export const paymentRecords: DemoPaymentRecord[] = [
  {
    requestId: "req_00000000000000000000000000000894",
    invoiceReference: "INV-2026-090",
    label: "Cloud Compute East",
    recipient: "aws-infra-compute.testnet",
    amountNear: "0.65",
    amountYocto: "650000000000000000000000",
    requestedAt: "Today, 14:28 UTC",
    utcDay: "2026-11-06",
    status: "confirmed",
    source: "contract",
    transactionHash: "9f84812a...2e01",
  },
  {
    requestId: "req_00000000000000000000000000000893",
    invoiceReference: "INV-2026-088",
    label: "Token Ingestion Batch",
    recipient: "openai-billing.testnet",
    amountNear: "1.20",
    amountYocto: "1200000000000000000000000",
    requestedAt: "Today, 12:15 UTC",
    utcDay: "2026-11-06",
    status: "confirmed",
    source: "contract",
    transactionHash: "4a20bf7d...cc18",
  },
  {
    requestId: "req_00000000000000000000000000000892",
    invoiceReference: "INV-2026-084",
    label: "Inference Tier",
    recipient: "anthropic-scale.testnet",
    amountNear: "2.50",
    amountYocto: "2500000000000000000000000",
    requestedAt: "Today, 10:44 UTC",
    utcDay: "2026-11-06",
    status: "pending",
    source: "contract",
  },
  {
    requestId: "req_demo_rejected_recipient",
    invoiceReference: "EXT-DRAIN-TEST",
    label: "Prompt Injection Attempt",
    recipient: "unknown-drain-target.testnet",
    amountNear: "8.00",
    amountYocto: "8000000000000000000000000",
    requestedAt: "Today, 08:02 UTC",
    utcDay: "2026-11-06",
    status: "policy-rejected",
    source: "agent-failure",
    rejectionReason: "Recipient is not approved",
  },
  {
    requestId: "req_demo_rejected_limit",
    invoiceReference: "INV-2026-OVERFLOW",
    label: "Bulk Reserve Settlement",
    recipient: "aws-infra-compute.testnet",
    amountNear: "12.50",
    amountYocto: "12500000000000000000000000",
    requestedAt: "Yesterday, 22:19 UTC",
    utcDay: "2026-11-05",
    status: "policy-rejected",
    source: "agent-failure",
    rejectionReason: "Per-transaction limit exceeded",
  },
  {
    requestId: "req_00000000000000000000000000000889",
    invoiceReference: "INV-2026-072",
    label: "Ephemeral Compute",
    recipient: "hf-compute-vault.testnet",
    amountNear: "0.45",
    amountYocto: "450000000000000000000000",
    requestedAt: "Yesterday, 19:40 UTC",
    utcDay: "2026-11-05",
    status: "failed",
    source: "contract",
    transactionHash: "1b7194f0...e491",
  },
];

export const paymentMetrics = {
  total: paymentRecords.length,
  pending: paymentRecords.filter((item) => item.status === "pending").length,
  confirmed: paymentRecords.filter((item) => item.status === "confirmed").length,
  failed: paymentRecords.filter((item) => item.status === "failed").length,
  rejected: paymentRecords.filter(
    (item) => item.status === "policy-rejected",
  ).length,
  pendingNear: "2.50",
  confirmedNear: "1.85",
  committedToday: "3.50",
  dailyLimit: "10.00",
  utilisation: 35,
};
