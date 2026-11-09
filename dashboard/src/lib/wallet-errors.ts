export type WalletActionError =
  | {
      kind: "cancelled";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    };

function getErrorMessage(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }

  if (
    typeof cause === "object" &&
    cause !== null &&
    "message" in cause &&
    typeof cause.message === "string"
  ) {
    return cause.message;
  }

  if (typeof cause === "string") {
    return cause;
  }

  return "Unknown wallet error";
}

export function classifyWalletActionError(
  cause: unknown,
): WalletActionError {
  const message = getErrorMessage(cause);
  const normalised = message.toLowerCase();

  const cancelled =
    normalised.includes("user rejected") ||
    normalised.includes("rejected by user") ||
    normalised.includes("user cancelled") ||
    normalised.includes("cancelled by user") ||
    normalised.includes("user canceled") ||
    normalised.includes("canceled by user");

  if (cancelled) {
    return {
      kind: "cancelled",
      message: "Wallet signature request was cancelled.",
    };
  }

  return {
    kind: "error",
    message,
  };
}
