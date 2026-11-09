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

export function parseNearToYoctoNear(value: string): string {
  const input = value.trim();

  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,24})?$/.test(input)) {
    throw new Error("Invalid NEAR amount");
  }

  const [wholePart, fractionPart = ""] = input.split(".");

  const whole = BigInt(wholePart);
  const fraction = BigInt(
    fractionPart.padEnd(24, "0") || "0",
  );

  const yocto =
    whole * YOCTO_PER_NEAR +
    fraction;

  if (yocto <= BigInt(0)) {
    throw new Error("NEAR amount must be greater than zero");
  }

  return yocto.toString();
}
