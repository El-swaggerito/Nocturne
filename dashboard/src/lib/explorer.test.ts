import { describe, expect, it } from "vitest";

import {
  getTransactionExplorerUrl,
  shortenHash,
} from "./explorer";

describe("transaction explorer", () => {
  it("builds the NEAR testnet transaction URL", () => {
    expect(
      getTransactionExplorerUrl("abc123"),
    ).toBe(
      "https://testnet.nearblocks.io/txns/abc123",
    );
  });

  it("shortens long transaction hashes", () => {
    expect(
      shortenHash(
        "123456789abcdefghijklmnopqrstuvwxyz7654321",
      ),
    ).toBe("123456789...7654321");
  });

  it("leaves short values unchanged", () => {
    expect(shortenHash("short-hash")).toBe("short-hash");
  });
});
