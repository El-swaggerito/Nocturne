"use client";

import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type PaymentFilter =
  | "all"
  | "confirmed"
  | "pending"
  | "failed";

type PaymentFiltersProps = {
  query: string;
  activeFilter: PaymentFilter;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: PaymentFilter) => void;
  counts: Record<PaymentFilter, number>;
};

const options: Array<{
  id: PaymentFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
];

export function PaymentFilters({
  query,
  activeFilter,
  onQueryChange,
  onFilterChange,
  counts,
}: PaymentFiltersProps) {
  return (
    <section className="rounded-card border border-border bg-card p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />

          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search request ID, invoice ref or recipient..."
            className="h-10 w-full rounded-control border border-border bg-elevated pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-faint focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-control bg-elevated p-1">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onFilterChange(option.id)}
              className={cn(
                "rounded px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider transition-colors",
                activeFilter === option.id
                  ? "bg-card text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {option.label} ({counts[option.id]})
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            onQueryChange("");
            onFilterChange("all");
          }}
          className="inline-flex h-9 items-center justify-center gap-1 rounded-control px-3 text-xs text-muted hover:bg-elevated hover:text-foreground"
        >
          <X size={14} />
          Reset
        </button>
      </div>
    </section>
  );
}
