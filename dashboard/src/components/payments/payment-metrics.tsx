import {
  CircleX,
  Clock3,
  Gauge,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type {
  PaymentView,
  SpendingView,
} from "@/lib/contract-types";
import {
  formatYoctoNear,
  percentageOfLimit,
} from "@/lib/format-near";

export function PaymentMetrics({
  payments,
  spending,
}: {
  payments: PaymentView[];
  spending: SpendingView;
}) {
  const pending = payments.filter(
    (item) => item.status === "pending",
  );

  const confirmed = payments.filter(
    (item) => item.status === "confirmed",
  );

  const failed = payments.filter(
    (item) => item.status === "failed",
  );

  const pendingTotal = pending.reduce(
    (total, item) => total + BigInt(item.amount_yocto),
    BigInt(0),
  );

  const confirmedTotal = confirmed.reduce(
    (total, item) => total + BigInt(item.amount_yocto),
    BigInt(0),
  );

  const utilisation = percentageOfLimit(
    spending.daily_committed,
    spending.daily_limit,
  );

  const metrics = [
    {
      label: "Retained Records",
      value: String(payments.length),
      suffix: "records",
      caption: "Current Guard history",
      icon: ReceiptText,
      tone: "text-foreground",
    },
    {
      label: "Pending Settlement",
      value: String(pending.length),
      suffix: "payments",
      caption: `${formatYoctoNear(pendingTotal)} NEAR pending`,
      icon: Clock3,
      tone: "text-warning",
    },
    {
      label: "Confirmed",
      value: String(confirmed.length),
      suffix: "payments",
      caption: `${formatYoctoNear(confirmedTotal)} NEAR retained total`,
      icon: ShieldCheck,
      tone: "text-cyan",
    },
    {
      label: "Failed",
      value: String(failed.length),
      suffix: "payments",
      caption: "Recorded transfer failures",
      icon: CircleX,
      tone: "text-danger",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map(({ label, value, suffix, caption, icon: Icon, tone }) => (
        <Card
          key={label}
          className="flex min-h-[142px] flex-col justify-between p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{label}</span>
            <Icon size={17} className={tone} />
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-technical text-2xl ${tone}`}>
                {value}
              </span>

              <span className="text-[10px] text-muted">
                {suffix}
              </span>
            </div>

            <p className="font-technical mt-1 text-[9px] text-muted">
              {caption}
            </p>
          </div>
        </Card>
      ))}

      <Card className="flex min-h-[142px] flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">
            Today&apos;s Committed
          </span>

          <Gauge size={17} className="text-cyan" />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-technical text-lg">
              {formatYoctoNear(spending.daily_committed)} NEAR
            </span>

            <span className="font-technical text-[9px] text-muted">
              / {formatYoctoNear(spending.daily_limit)}
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-cyan"
              style={{ width: `${utilisation}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-muted">
              UTC day {spending.utc_day}
            </span>

            <span className="font-technical text-[9px] text-cyan">
              {utilisation}% used
            </span>
          </div>
        </div>
      </Card>
    </section>
  );
}
