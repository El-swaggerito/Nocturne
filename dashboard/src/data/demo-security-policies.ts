export type ApprovedRecipient = {
  accountId: string;
  label: string;
};

export const initialApprovedRecipients: ApprovedRecipient[] = [
  {
    accountId: "aws-infra-compute.testnet",
    label: "Tier 1 Cloud Compute",
  },
  {
    accountId: "openai-billing.testnet",
    label: "LLM Inference API",
  },
  {
    accountId: "pinecone-vector.testnet",
    label: "Vector DB Store",
  },
  {
    accountId: "anthropic-scale.testnet",
    label: "Claude API Operations",
  },
];

export const initialPolicy = {
  dailyLimit: "10.00",
  transactionLimit: "5.00",
  committedToday: "4.20",
  frozen: false,
  ownerAccount: "owner.nocturne.testnet",
  agentAccount: "agent-v1.nocturne.testnet",
};
