import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

import { PaymentStatus } from "@/components/overview/payment-status";
import type { PaymentView } from "@/lib/contract-types";
import { formatYoctoNear } from "@/lib/format-near";

function normaliseStatus(
  status: string,
): "confirmed" | "pending" | "failed" {
  if (status === "confirmed") return "confirmed";
  if (status === "pending") return "pending";

  return "failed";
}

export function RecentPayments({
  payments,
}: {
  payments: PaymentView[];
}) {
  return (
    <section className="rounded-card border border-border bg-card p-5 lg:col-span-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">
              Recent Payments
            </h2>

            <span className="font-technical rounded bg-elevated px-2 py-0.5 text-[10px] text-muted">
              {payments.length} On-chain Records
            </span>
          </div>

          <p className="mt-1 text-xs text-muted">
            Retained payment records from the Nocturne Guard
          </p>
        </div>

        <Link
          href="/payments"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
        >
          View all payments
          <ArrowRight size={14} />
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="mt-5 rounded-control border border-border bg-elevated/50 px-4 py-8 text-center">
          <p className="text-sm font-medium">
            No retained payments
          </p>

          <p className="mt-1 text-xs text-muted">
            The Guard has not returned any retained payment records.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="bg-elevated text-[10px] uppercase tracking-wider text-muted">
                <th className="rounded-l px-3 py-3 font-semibold">
                  Invoice Ref
                </th>

                <th className="px-3 py-3 font-semibold">
                  Recipient
                </th>

                <th className="px-3 py-3 font-semibold">
                  Amount
                </th>

                <th className="px-3 py-3 font-semibold">
                  UTC Day
                </th>

                <th className="rounded-r px-3 py-3 font-semibold">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {payments.map((payment) => (
                <tr
                  key={payment.request_id}
                  className="transition-colors hover:bg-elevated/40"
                >
                  <td className="font-technical px-3 py-3.5 text-[11px] font-medium">
                    {payment.invoice_reference}
                  </td>

                  <td
                    className="font-technical max-w-[220px] truncate px-3 py-3.5 text-[11px] text-muted"
                    title={payment.recipient_id}
                  >
                    {payment.recipient_id}
                  </td>

                  <td className="font-technical px-3 py-3.5 text-[11px] font-medium">
                    {formatYoctoNear(payment.amount_yocto)} NEAR
                  </td>

                  <td className="font-technical px-3 py-3.5 text-[10px] text-muted">
                    {payment.utc_day}
                  </td>

                  <td className="px-3 py-3.5">
                    <PaymentStatus
                      status={normaliseStatus(payment.status)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-4 text-[10px] text-muted">
        <LockKeyhole size={13} className="text-cyan" />

        <span>
          Only retained contract payment records are shown. Policy-rejected
          requests are not fabricated as payment records.
        </span>
      </div>
    </section>
  );
}
