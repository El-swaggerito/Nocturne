import { describe, expect, it } from "vitest";

import { classifyWalletActionError } from "./wallet-errors";

describe("classifyWalletActionError", () => {
  it("classifies user rejected errors as cancellation", () => {
    expect(
      classifyWalletActionError(
        new Error("User rejected the request"),
      ),
    ).toEqual({
      kind: "cancelled",
      message: "Wallet signature request was cancelled.",
    });
  });

  it("classifies user cancelled errors as cancellation", () => {
    expect(
      classifyWalletActionError(
        new Error("User cancelled transaction"),
      ),
    ).toEqual({
      kind: "cancelled",
      message: "Wallet signature request was cancelled.",
    });
  });

  it("classifies user canceled errors as cancellation", () => {
    expect(
      classifyWalletActionError(
        new Error("Transaction canceled by user"),
      ),
    ).toEqual({
      kind: "cancelled",
      message: "Wallet signature request was cancelled.",
    });
  });

  it("does not misclassify contract failures", () => {
    expect(
      classifyWalletActionError(
        new Error("Smart contract panicked: contract is frozen"),
      ),
    ).toEqual({
      kind: "error",
      message: "Smart contract panicked: contract is frozen",
    });
  });

  it("handles wallet-shaped message objects", () => {
    expect(
      classifyWalletActionError({
        message: "User rejected transaction",
      }),
    ).toEqual({
      kind: "cancelled",
      message: "Wallet signature request was cancelled.",
    });
  });

  it("handles unknown thrown values", () => {
    expect(
      classifyWalletActionError(null),
    ).toEqual({
      kind: "error",
      message: "Unknown wallet error",
    });
  });
});
