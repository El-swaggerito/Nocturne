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
