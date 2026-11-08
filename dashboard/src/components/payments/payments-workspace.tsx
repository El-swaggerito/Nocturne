"use client";

import { useMemo, useState } from "react";

import {
  PaymentFilters,
  type PaymentFilter,
} from "@/components/payments/payment-filters";
import { PaymentInspector } from "@/components/payments/payment-inspector";
import { PaymentTable } from "@/components/payments/payment-table";
import type { PaymentView } from "@/lib/contract-types";

export function PaymentsWorkspace({
  records = [],
}: {
  records?: PaymentView[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<PaymentFilter>("all");
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: records.length,
      confirmed: records.filter(
        (item) => item.status === "confirmed",
      ).length,
      pending: records.filter(
        (item) => item.status === "pending",
      ).length,
      failed: records.filter(
        (item) => item.status === "failed",
      ).length,
    }),
    [records],
  );

  const filtered = useMemo(() => {
    const normalised = query.trim().toLowerCase();

    return records.filter((record) => {
      const recordStatus =
        record.status === "confirmed"
          ? "confirmed"
          : record.status === "pending"
            ? "pending"
            : "failed";

      const statusMatch =
        filter === "all" || recordStatus === filter;

      const queryMatch =
        !normalised ||
        record.request_id
          .toLowerCase()
          .includes(normalised) ||
        record.invoice_reference
          .toLowerCase()
          .includes(normalised) ||
        record.recipient_id
          .toLowerCase()
          .includes(normalised);

      return statusMatch && queryMatch;
    });
  }, [filter, query, records]);

  const selected =
    records.find(
      (record) => record.request_id === selectedId,
    ) ??
    records[0] ??
    null;

  return (
    <div className="space-y-4">
      <PaymentFilters
        query={query}
        activeFilter={filter}
        onQueryChange={setQuery}
        onFilterChange={setFilter}
        counts={counts}
      />

      <div className="flex flex-col items-start gap-4 2xl:flex-row">
        <div className="w-full min-w-0 flex-1">
          <PaymentTable
            records={filtered}
            selectedId={selected?.request_id ?? null}
            onSelect={(record) =>
              setSelectedId(record.request_id)
            }
          />
        </div>

        <PaymentInspector record={selected} />
      </div>
    </div>
  );
}
