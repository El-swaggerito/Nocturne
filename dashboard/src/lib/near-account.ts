export function isValidNearAccountId(value: string): boolean {
  const accountId = value.trim();

  if (accountId.length < 2 || accountId.length > 64) {
    return false;
  }

  return /^(?:[a-z0-9]+(?:[-_][a-z0-9]+)*)(?:\.(?:[a-z0-9]+(?:[-_][a-z0-9]+)*))*$/.test(
    accountId,
  );
}
