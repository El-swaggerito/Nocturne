import type { PaymentView } from "@/lib/contract-types";
import { guardViews } from "@/lib/near";

const REQUEST_PREFIX = "req_";
const REQUEST_HEX_WIDTH = 32;
const DEFAULT_HISTORY_LIMIT = 10;
const MAX_HISTORY_SCAN = 64;
const BATCH_SIZE = 8;

function requestIdFromNonce(nonce: bigint): string {
  return `${REQUEST_PREFIX}${nonce.toString(16).padStart(REQUEST_HEX_WIDTH, "0")}`;
}

function nonceFromRequestId(requestId: string): bigint {
  if (!requestId.startsWith(REQUEST_PREFIX)) {
    throw new Error("Unexpected Guard request ID format");
  }

  const value = requestId.slice(REQUEST_PREFIX.length);

  if (!/^[0-9a-f]{32}$/.test(value)) {
    throw new Error("Unexpected Guard request ID format");
  }

  return BigInt(`0x${value}`);
}

export async function getRecentPayments(
  limit = DEFAULT_HISTORY_LIMIT,
): Promise<PaymentView[]> {
  if (limit <= 0) {
    return [];
  }

  const nextRequestId = await guardViews.getNextRequestId();

  if (typeof nextRequestId !== "string") {
    throw new Error("Guard returned an invalid next request ID");
  }

  const nextNonce = nonceFromRequestId(nextRequestId);

  if (nextNonce <= BigInt(1)) {
    return [];
  }

  const payments: PaymentView[] = [];
  let candidate = nextNonce - BigInt(1);
  let scanned = 0;

  while (
    candidate >= BigInt(1) &&
    payments.length < limit &&
    scanned < MAX_HISTORY_SCAN
  ) {
    const batch: bigint[] = [];

    while (
      candidate >= BigInt(1) &&
      batch.length < BATCH_SIZE &&
      scanned < MAX_HISTORY_SCAN
    ) {
      batch.push(candidate);
      candidate -= BigInt(1);
      scanned += 1;
    }

    const results = await Promise.all(
      batch.map((nonce) =>
        guardViews.getPayment(requestIdFromNonce(nonce)),
      ),
    );

    for (const payment of results) {
      if (!payment) continue;

      payments.push(payment);

      if (payments.length >= limit) {
        break;
      }
    }
  }

  return payments;
}
