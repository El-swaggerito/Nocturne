import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

import { PaymentStatus } from "@/components/overview/payment-status";
import type { DemoPayment } from "@/data/demo-overview";

export function RecentPayments({
  payments,
}: {
  payments: DemoPayment[];
}) {
  return (
    <section className="rounded-card border border-border bg-card p-5 lg:col-span-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Recent Payments</h2>

            <span className="font-technical rounded bg-elevated px-2 py-0.5 text-[10px] text-muted">
              {payments.length} Demo Records
            </span>
          </div>

          <p className="mt-1 text-xs text-muted">
            Agent payment proposals and settlement outcomes
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

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
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
                Timestamp
              </th>
              <th className="px-3 py-3 font-semibold">
                Status
              </th>
              <th className="rounded-r px-3 py-3 text-right font-semibold">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {payments.map((payment) => (
              <tr
                key={payment.invoiceReference}
                className="transition-colors hover:bg-elevated/40"
              >
                <td className="font-technical px-3 py-3.5 text-[11px] font-medium">
                  {payment.invoiceReference}
                </td>

                <td className="font-technical px-3 py-3.5 text-[11px] text-muted">
                  {payment.recipient}
                </td>

                <td className="font-technical px-3 py-3.5 text-[11px] font-medium">
                  {payment.amount}
                </td>

                <td className="font-technical px-3 py-3.5 text-[10px] text-muted">
                  {payment.timestamp}
                </td>

                <td className="px-3 py-3.5">
                  <PaymentStatus status={payment.status} />
                </td>

                <td className="px-3 py-3.5 text-right">
                  <button
                    type="button"
                    className="font-technical inline-flex items-center gap-1 text-[10px] text-primary"
                  >
                    Details
                    <ArrowRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4 text-[10px] text-muted">
        <div className="flex items-center gap-1.5">
          <LockKeyhole size={13} className="text-cyan" />
          <span>
            Demo values only. Contract policy remains authoritative.
          </span>
        </div>

        <span className="font-technical hidden sm:inline">
          Demonstration Ledger
        </span>
      </div>
    </section>
  );
}
