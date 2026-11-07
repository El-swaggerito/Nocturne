import {
  Bot,
  ListChecks,
  ShieldCheck,
  Snowflake,
  WalletCards,
} from "lucide-react";

import { Card } from "@/components/ui/card";

type PolicyMetricsProps = {
  dailyLimit: string;
  transactionLimit: string;
  recipientCount: number;
  frozen: boolean;
};

export function PolicyMetrics({
  dailyLimit,
  transactionLimit,
  recipientCount,
  frozen,
}: PolicyMetricsProps) {
  const items = [
    {
      label: "Daily Limit",
      value: `${dailyLimit} NEAR`,
      detail: "Resets by UTC accounting day",
      icon: WalletCards,
      tone: "text-cyan",
    },
    {
      label: "Per-Tx Limit",
      value: `${transactionLimit} NEAR`,
      detail: "Maximum single request",
      icon: ShieldCheck,
      tone: "text-primary",
    },
    {
      label: "Allowlist",
      value: `${recipientCount} accounts`,
      detail: "Approved recipients only",
      icon: ListChecks,
      tone: "text-cyan",
    },
    {
      label: "Freeze Status",
      value: frozen ? "Frozen" : "Unfrozen",
      detail: frozen
        ? "New payment requests blocked"
        : "Valid requests may proceed",
      icon: Snowflake,
      tone: frozen ? "text-danger" : "text-cyan",
    },
    {
      label: "Agent Scope",
      value: "Restricted",
      detail: "request_payment only",
      icon: Bot,
      tone: "text-primary",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map(({ label, value, detail, icon: Icon, tone }) => (
        <Card
          key={label}
          className="flex min-h-[138px] flex-col justify-between p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{label}</span>
            <Icon size={17} className={tone} />
          </div>

          <div>
            <p className={`font-technical text-lg ${tone}`}>{value}</p>
            <p className="mt-1 text-[10px] leading-4 text-muted">
              {detail}
            </p>
          </div>
        </Card>
      ))}
    </section>
  );
}
