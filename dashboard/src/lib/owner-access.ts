export type OwnerAccessState =
  | "guard-unavailable"
  | "disconnected"
  | "owner"
  | "non-owner";

export function getOwnerAccessState({
  accountId,
  ownerId,
  guardAvailable,
}: {
  accountId: string | null;
  ownerId: string | null;
  guardAvailable: boolean;
}): OwnerAccessState {
  if (!guardAvailable || !ownerId) {
    return "guard-unavailable";
  }

  if (!accountId) {
    return "disconnected";
  }

  return accountId === ownerId
    ? "owner"
    : "non-owner";
}
