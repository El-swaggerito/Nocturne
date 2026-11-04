import test from "node:test";
import assert from "node:assert/strict";
import { ConfigurationError, DEFAULT_NEAR_AI_MODEL, loadNearAIConfig, NEAR_AI_BASE_URL } from "../src/config.js";

test("missing NEAR AI Cloud key produces a clear, non-secret error", () => {
  assert.throws(() => loadNearAIConfig({}), ConfigurationError);
  assert.throws(() => loadNearAIConfig({ NEAR_AI_KEY: "  " }), /NEAR_AI_KEY is missing/);
  assert.throws(
    () => loadNearAIConfig({ NEAR_AI_KEY: "replace-with-your-near-ai-cloud-key" }),
    /NEAR_AI_KEY is missing/,
  );
});

test("valid config never permits base URL to be overridden", () => {
  const config = loadNearAIConfig({
    NEAR_AI_KEY: "test-value-not-a-real-key",
    NEAR_AI_MODEL: "deepseek/deepseek-v3.2",
    NEAR_AI_BASE_URL: "https://attacker.invalid/v1",
  });
  assert.equal(config.baseURL, NEAR_AI_BASE_URL);
  assert.equal(config.model, DEFAULT_NEAR_AI_MODEL);
  assert.equal(config.apiKey, "test-value-not-a-real-key");
});
