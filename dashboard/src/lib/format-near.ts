const YOCTO_PER_NEAR = BigInt("1000000000000000000000000");

export function formatYoctoNear(
  value: string | bigint,
  fractionDigits = 4,
): string {
  const amount = typeof value === "bigint" ? value : BigInt(value);

  const whole = amount / YOCTO_PER_NEAR;
  const remainder = amount % YOCTO_PER_NEAR;

  if (fractionDigits <= 0 || remainder === BigInt(0)) {
    return whole.toString();
  }

  const fraction = remainder
    .toString()
    .padStart(24, "0")
    .slice(0, fractionDigits)
    .replace(/0+$/, "");

  if (!fraction) {
    return whole.toString();
  }

  return `${whole}.${fraction}`;
}

export function percentageOfLimit(
  committed: string,
  limit: string,
): number {
  const committedValue = BigInt(committed);
  const limitValue = BigInt(limit);

  if (limitValue === BigInt(0)) {
    return 0;
  }

  const basisPoints =
    (committedValue * BigInt(10000)) / limitValue;

  return Math.min(
    100,
    Number(basisPoints) / 100,
  );
}
