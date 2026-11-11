/** All inference credentials are server-side only; no blockchain signing key belongs here. */
export const NEAR_AI_BASE_URL = "https://cloud-api.near.ai/v1";
export const DEFAULT_NEAR_AI_MODEL = "deepseek/deepseek-v3.2";

export interface NearAIConfig {
  readonly apiKey: string;
  readonly baseURL: typeof NEAR_AI_BASE_URL;
  readonly model: string;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/** A parameter makes missing-key behaviour testable without editing process.env. */
export function loadNearAIConfig(
  environment: Record<string, string | undefined> = process.env,
): NearAIConfig {
  const apiKey = environment.NEAR_AI_KEY?.trim();
  if (!apiKey || apiKey === "replace-with-your-near-ai-cloud-key") {
    throw new ConfigurationError(
      "NEAR_AI_KEY is missing. Create a local .env from .env.example and provide a NEAR AI Cloud API key.",
    );
  }

  const model = environment.NEAR_AI_MODEL?.trim() || DEFAULT_NEAR_AI_MODEL;
  // Do not permit an environment-provided arbitrary base URL to receive the key.
  return { apiKey, baseURL: NEAR_AI_BASE_URL, model };
}

// Issue #10: deliberately separate inference credentials from the signing key.
// Fixed testnet RPC prevents an environment override from receiving RPC data.
import { nearAccountIdSchema } from "./types.js";

export const NEAR_TESTNET_RPC_URL = "https://rpc.testnet.near.org";

export interface NearPaymentConfig {
  readonly network: "testnet";
  readonly rpcUrl: typeof NEAR_TESTNET_RPC_URL;
  readonly contractId: string;
  readonly agentId: string;
  readonly agentSecretKey: string;
  readonly journalDir: string;
  readonly enableTestnetWrites: boolean;
  readonly contractInterfaceApproved: boolean;
}

/** Never accept an owner key, full-access signing key or RPC URL override. */
export function loadNearPaymentConfig(
  environment: Record<string, string | undefined> = process.env,
): NearPaymentConfig {
  const contractId = environment.NEAR_GUARD_ACCOUNT_ID?.trim();
  const agentId = environment.NEAR_AGENT_ACCOUNT_ID?.trim();
  const agentSecretKey = environment.NEAR_AGENT_PRIVATE_KEY?.trim();
  if (!contractId || !nearAccountIdSchema.safeParse(contractId).success) {
    throw new ConfigurationError("NEAR_GUARD_ACCOUNT_ID is missing or invalid.");
  }
  if (!agentId || !nearAccountIdSchema.safeParse(agentId).success || agentId === contractId) {
    throw new ConfigurationError("NEAR_AGENT_ACCOUNT_ID is missing or invalid, or equals the Guard account.");
  }
  if (!agentSecretKey?.startsWith("ed25519:") || agentSecretKey.length < 30) {
    throw new ConfigurationError("A restricted NEAR_AGENT_PRIVATE_KEY is required; do not use an owner key.");
  }
  if (environment.NEAR_NETWORK && environment.NEAR_NETWORK !== "testnet") {
    throw new ConfigurationError("Issue #10 only supports the NEAR testnet.");
  }
  const enableTestnetWrites = environment.NEAR_ENABLE_TESTNET_WRITES === "yes";
  const contractInterfaceApproved = environment.NEAR_CONTRACT_INTERFACE_AGREED === "yes";
  return {
    network: "testnet",
    rpcUrl: NEAR_TESTNET_RPC_URL,
    contractId,
    agentId,
    agentSecretKey,
    journalDir: environment.NEAR_PAYMENT_JOURNAL_DIR?.trim() || ".local/payment-requests",
    enableTestnetWrites,
    contractInterfaceApproved,
  };
}
