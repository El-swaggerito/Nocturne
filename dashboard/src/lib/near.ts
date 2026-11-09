import { JsonRpcProvider } from "near-api-js";

import type {
  PaymentView,
  PolicyView,
  SpendingView,
} from "@/lib/contract-types";

export type NearNetwork = "testnet" | "mainnet";

const network = process.env.NEXT_PUBLIC_NEAR_NETWORK ?? "testnet";

if (network !== "testnet" && network !== "mainnet") {
  throw new Error(
    `Unsupported NEXT_PUBLIC_NEAR_NETWORK: ${network}`,
  );
}

export const nearConfig = {
  networkId: network as NearNetwork,
  contractId: process.env.NEXT_PUBLIC_GUARD_CONTRACT_ID?.trim() ?? "",
  nodeUrl:
    network === "testnet"
      ? "https://rpc.testnet.near.org"
      : "https://rpc.mainnet.near.org",
} as const;

export const hasConfiguredGuard = nearConfig.contractId.length > 0;

const provider = new JsonRpcProvider({
  url: nearConfig.nodeUrl,
});

export function requireContractId() {
  if (!nearConfig.contractId) {
    throw new Error(
      "NEXT_PUBLIC_GUARD_CONTRACT_ID is not configured",
    );
  }

  return nearConfig.contractId;
}

export const guardAccount = {
  async getBalance() {
    const account = await provider.viewAccount({
      accountId: requireContractId(),
      blockQuery: {
        finality: "final",
      },
    });

    return {
      amount: account.amount.toString(),
      locked: account.locked.toString(),
      storageUsage: account.storage_usage,
    };
  },
};

export const guardViews = {
  getOwner() {
    return provider.callFunction<string>({
      contractId: requireContractId(),
      method: "get_owner",
      args: {},
    });
  },

  getAgent() {
    return provider.callFunction<string>({
      contractId: requireContractId(),
      method: "get_agent",
      args: {},
    });
  },

  isFrozen() {
    return provider.callFunction<boolean>({
      contractId: requireContractId(),
      method: "is_frozen",
      args: {},
    });
  },

  getNextRequestId() {
    return provider.callFunction<string>({
      contractId: requireContractId(),
      method: "get_next_request_id",
      args: {},
    });
  },

  getPolicy() {
    return provider.callFunction<PolicyView>({
      contractId: requireContractId(),
      method: "get_policy",
      args: {},
    });
  },

  getSpending() {
    return provider.callFunction<SpendingView>({
      contractId: requireContractId(),
      method: "get_spending",
      args: {},
    });
  },

  async getPayment(requestId: string): Promise<PaymentView | null> {
    const result = await provider.callFunction<PaymentView>({
      contractId: requireContractId(),
      method: "get_payment",
      args: {
        request_id: requestId,
      },
    });

    return result ?? null;
  },
};
