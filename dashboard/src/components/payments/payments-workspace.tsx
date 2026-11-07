"use client";

import { useMemo, useState } from "react";

import {
  PaymentFilters,
  type PaymentFilter,
} from "@/components/payments/payment-filters";
import { PaymentInspector } from "@/components/payments/payment-inspector";
import { PaymentTable } from "@/components/payments/payment-table";
import {
  paymentRecords,
  type DemoPaymentRecord,
} from "@/data/demo-payments";

export function PaymentsWorkspace() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<PaymentFilter>("all");

  const [selected, setSelected] =
    useState<DemoPaymentRecord | null>(paymentRecords[0] ?? null);

  const counts = useMemo(
    () => ({
      all: paymentRecords.length,
      confirmed: paymentRecords.filter(
        (item) => item.status === "confirmed",
      ).length,
      pending: paymentRecords.filter(
        (item) => item.status === "pending",
      ).length,
      failed: paymentRecords.filter(
        (item) => item.status === "failed",
      ).length,
      "policy-rejected": paymentRecords.filter(
        (item) => item.status === "policy-rejected",
      ).length,
    }),
    [],
  );

  const filtered = useMemo(() => {
    const normalised = query.trim().toLowerCase();

    return paymentRecords.filter((record) => {
      const statusMatch =
        filter === "all" || record.status === filter;

      const queryMatch =
        !normalised ||
        record.requestId.toLowerCase().includes(normalised) ||
        record.invoiceReference.toLowerCase().includes(normalised) ||
        record.recipient.toLowerCase().includes(normalised);

      return statusMatch && queryMatch;
    });
  }, [filter, query]);

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
            selectedId={selected?.requestId ?? null}
            onSelect={setSelected}
          />
        </div>

        <PaymentInspector record={selected} />
      </div>
    </div>
  );
}
