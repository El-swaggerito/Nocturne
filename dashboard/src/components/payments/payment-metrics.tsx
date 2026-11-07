import {
  CircleX,
  Clock3,
  Gauge,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { paymentMetrics } from "@/data/demo-payments";

const metrics = [
  {
    label: "Demo Records",
    value: String(paymentMetrics.total),
    suffix: "records",
    caption: "Current UI dataset",
    icon: ReceiptText,
    tone: "text-foreground",
  },
  {
    label: "Pending Settlement",
    value: String(paymentMetrics.pending),
    suffix: "payments",
    caption: `${paymentMetrics.pendingNear} NEAR reserved`,
    icon: Clock3,
    tone: "text-warning",
  },
  {
    label: "Confirmed",
    value: String(paymentMetrics.confirmed),
    suffix: "payments",
    caption: `${paymentMetrics.confirmedNear} NEAR demo total`,
    icon: ShieldCheck,
    tone: "text-cyan",
  },
  {
    label: "Rejected / Failed",
    value: String(paymentMetrics.rejected + paymentMetrics.failed),
    suffix: "events",
    caption: `${paymentMetrics.rejected} rejected · ${paymentMetrics.failed} failed`,
    icon: CircleX,
    tone: "text-danger",
  },
];

export function PaymentMetrics() {
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
              <span className="text-[10px] text-muted">{suffix}</span>
            </div>

            <p className="font-technical mt-1 text-[9px] text-muted">
              {caption}
            </p>
          </div>
        </Card>
      ))}

      <Card className="flex min-h-[142px] flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Today&apos;s Committed</span>
          <Gauge size={17} className="text-cyan" />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-technical text-lg">
              {paymentMetrics.committedToday} NEAR
            </span>
            <span className="font-technical text-[9px] text-muted">
              / {paymentMetrics.dailyLimit}
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-cyan"
              style={{ width: `${paymentMetrics.utilisation}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-muted">
              UTC day
            </span>
            <span className="font-technical text-[9px] text-cyan">
              {paymentMetrics.utilisation}% used
            </span>
          </div>
        </div>
      </Card>
    </section>
  );
}
