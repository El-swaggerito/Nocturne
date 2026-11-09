import { describe, expect, it } from "vitest";

import { isValidNearAccountId } from "./near-account";

describe("isValidNearAccountId", () => {
  it.each([
    "aa",
    "owner.testnet",
    "data-oracle.testnet",
    "b-o_w_e-n",
    "10-4.8-2",
  ])("accepts valid account ID %s", (accountId) => {
    expect(isValidNearAccountId(accountId)).toBe(true);
  });

  it.each([
    "",
    "a",
    "Owner.testnet",
    "-near",
    "near-",
    ".near",
    "near.",
    "a..near",
    "hello world",
    "0__0",
  ])("rejects invalid account ID %s", (accountId) => {
    expect(isValidNearAccountId(accountId)).toBe(false);
  });
});
