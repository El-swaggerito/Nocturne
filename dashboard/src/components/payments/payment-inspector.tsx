import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PaymentView } from "@/lib/contract-types";
import { formatYoctoNear } from "@/lib/format-near";

export function PaymentInspector({
  record,
}: {
  record: PaymentView | null;
}) {
  if (!record) {
    return (
      <aside className="rounded-card border border-border bg-card p-5 2xl:w-[420px] 2xl:shrink-0">
        <p className="text-sm font-medium">
          Select a payment
        </p>

        <p className="mt-1 text-xs leading-5 text-muted">
          Choose a retained Guard payment record to inspect it.
        </p>
      </aside>
    );
  }

  const status =
    record.status === "confirmed"
      ? "confirmed"
      : record.status === "pending"
        ? "pending"
        : "failed";

  return (
    <aside className="rounded-card border border-border bg-card p-5 2xl:w-[420px] 2xl:shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="font-technical max-w-[260px] truncate text-xs font-medium"
            title={record.request_id}
          >
            {record.request_id}
          </p>

          <p className="mt-1 text-[10px] text-muted">
            Persistent Guard payment record
          </p>
        </div>

        <Badge
          variant={
            status === "confirmed"
              ? "success"
              : status === "pending"
                ? "warning"
                : "danger"
          }
        >
          {status === "confirmed"
            ? "Confirmed"
            : status === "pending"
              ? "Pending"
              : "Transfer Failed"}
        </Badge>
      </div>

      <section className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Contract Fields
        </p>

        <div className="mt-2 space-y-2 rounded-control bg-elevated p-3">
          <DetailRow
            label="Request ID"
            value={record.request_id}
          />

          <DetailRow
            label="Invoice Reference"
            value={record.invoice_reference}
          />

          <DetailRow
            label="Recipient"
            value={record.recipient_id}
            accent
          />

          <DetailRow
            label="Amount"
            value={`${formatYoctoNear(record.amount_yocto)} NEAR`}
          />

          <DetailRow
            label="Exact yoctoNEAR"
            value={record.amount_yocto}
          />

          <DetailRow
            label="UTC Accounting Day"
            value={String(record.utc_day)}
          />

          <DetailRow
            label="Status"
            value={
              status === "confirmed"
                ? "Confirmed"
                : status === "pending"
                  ? "Pending"
                  : "Failed"
            }
          />
        </div>
      </section>

      <div className="mt-5 rounded-control bg-elevated p-3">
        <div className="flex items-center gap-2 text-cyan">
          <ShieldCheck size={14} />

          <span className="text-[10px] font-semibold uppercase tracking-wider">
            Callback Settlement
          </span>
        </div>

        <p className="mt-2 text-[10px] leading-4 text-muted">
          Confirmed means the Guard callback recorded transfer success.
          Failed means the callback recorded transfer failure. Pending means
          settlement has not yet been recorded.
        </p>
      </div>

      <p className="mt-4 text-[9px] leading-4 text-faint">
        Transaction hashes and historical policy snapshots are not stored in
        PaymentView, so this dashboard does not fabricate them.
      </p>
    </aside>
  );
}

function DetailRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-[10px] text-muted">
        {label}
      </span>

      <span
        className={
          accent
            ? "font-technical max-w-[65%] break-words text-right text-[9px] text-cyan"
            : "font-technical max-w-[65%] break-words text-right text-[9px]"
        }
      >
        {value}
      </span>
    </div>
  );
}
