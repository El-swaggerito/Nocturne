"use client";

import { ArrowRight } from "lucide-react";

import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import type { PaymentView } from "@/lib/contract-types";
import { formatYoctoNear } from "@/lib/format-near";
import { cn } from "@/lib/utils";

type PaymentTableProps = {
  records: PaymentView[];
  selectedId: string | null;
  onSelect: (record: PaymentView) => void;
};

export function PaymentTable({
  records,
  selectedId,
  onSelect,
}: PaymentTableProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-card border border-border bg-card p-10 text-center">
        <p className="text-sm font-medium">
          No matching payment records
        </p>

        <p className="mt-1 text-xs text-muted">
          Adjust the current search or status filter.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="bg-elevated text-[9px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">
                Request ID
              </th>

              <th className="px-4 py-3 font-semibold">
                Invoice
              </th>

              <th className="px-4 py-3 font-semibold">
                Recipient
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Amount
              </th>

              <th className="px-4 py-3 font-semibold">
                UTC Day
              </th>

              <th className="px-4 py-3 font-semibold">
                Status
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {records.map((record) => {
              const selected =
                selectedId === record.request_id;

              return (
                <tr
                  key={record.request_id}
                  onClick={() => onSelect(record)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selected
                      ? "bg-elevated"
                      : "hover:bg-elevated/50",
                  )}
                >
                  <td
                    className="font-technical max-w-[190px] truncate px-4 py-3.5 text-[10px] text-cyan"
                    title={record.request_id}
                  >
                    {record.request_id}
                  </td>

                  <td className="font-technical px-4 py-3.5 text-[10px]">
                    {record.invoice_reference}
                  </td>

                  <td
                    className="font-technical max-w-[220px] truncate px-4 py-3.5 text-[10px] text-muted"
                    title={record.recipient_id}
                  >
                    {record.recipient_id}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <p className="font-technical text-[11px] font-medium">
                      {formatYoctoNear(record.amount_yocto)} NEAR
                    </p>

                    <p className="font-technical mt-0.5 text-[9px] text-faint">
                      {record.amount_yocto}
                    </p>
                  </td>

                  <td className="font-technical px-4 py-3.5 text-[9px] text-muted">
                    {record.utc_day}
                  </td>

                  <td className="px-4 py-3.5">
                    <PaymentStatusBadge
                      status={
                        record.status === "confirmed"
                          ? "confirmed"
                          : record.status === "pending"
                            ? "pending"
                            : "failed"
                      }
                    />
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(record);
                      }}
                      className="inline-flex items-center gap-1 rounded bg-elevated px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-foreground hover:bg-surface-hover"
                    >
                      Inspect
                      <ArrowRight size={11} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-elevated px-4 py-3 text-[10px] text-muted">
        <span>
          Showing {records.length} retained payment record
          {records.length === 1 ? "" : "s"}
        </span>

        <span className="font-technical">
          Guard contract history
        </span>
      </div>
    </div>
  );
}
