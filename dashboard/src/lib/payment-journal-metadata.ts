import { readdir, readFile } from "node:fs/promises";

const DEFAULT_JOURNAL_DIR = ".local/payment-requests";
const REQUEST_ID_PATTERN = /^req_[0-9a-f]{32}$/;

type JournalMetadata = {
  requestId: string;
  transactionHash?: string;
};

function parseJournalMetadata(raw: string): JournalMetadata | null {
  let value: unknown;

  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.requestId !== "string" ||
    !REQUEST_ID_PATTERN.test(record.requestId)
  ) {
    return null;
  }

  if (
    record.transactionHash !== undefined &&
    (typeof record.transactionHash !== "string" ||
      record.transactionHash.trim().length === 0)
  ) {
    return null;
  }

  return {
    requestId: record.requestId,
    transactionHash:
      typeof record.transactionHash === "string"
        ? record.transactionHash
        : undefined,
  };
}

export async function getTransactionHashesByRequestId(): Promise<
  Map<string, string>
> {
  const directory =
    process.env.NEAR_PAYMENT_JOURNAL_DIR?.trim() ||
    DEFAULT_JOURNAL_DIR;

  const hashes = new Map<string, string>();

  let entries;

  try {
    entries = await readdir(
      /* turbopackIgnore: true */ directory,
      { withFileTypes: true },
    );
  } catch {
    return hashes;
  }

  await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isFile() && entry.name.endsWith(".json"),
      )
      .map(async (entry) => {
        try {
          const raw = await readFile(
            `${directory}/${entry.name}`,
            "utf8",
          );

          const metadata = parseJournalMetadata(raw);

          if (metadata?.transactionHash) {
            hashes.set(
              metadata.requestId,
              metadata.transactionHash,
            );
          }
        } catch {
          // Local metadata must never make Guard state unavailable.
        }
      }),
  );

  return hashes;
}
