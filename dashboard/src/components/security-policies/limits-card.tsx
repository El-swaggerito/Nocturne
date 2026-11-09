import { ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";

type LimitsCardProps = {
  dailyLimit: string;
  transactionLimit: string;
  committedToday: string;
  remainingToday: string;
};

export function LimitsCard({
  dailyLimit,
  transactionLimit,
  committedToday,
  remainingToday,
}: LimitsCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">
              Spending Limits
            </h2>

            <span className="font-technical rounded bg-elevated px-2 py-0.5 text-[9px] uppercase text-primary">
              On-chain Policy
            </span>
          </div>

          <p className="mt-1 text-xs text-muted">
            Current limits enforced by the Nocturne Guard.
          </p>
        </div>

        <span className="font-technical rounded bg-elevated px-2 py-1 text-[9px] text-cyan">
          Read Only
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <LimitValue
          label="Daily Spending Limit"
          value={dailyLimit}
        />

        <LimitValue
          label="Per-Transaction Limit"
          value={transactionLimit}
        />

        <LimitValue
          label="Committed Today"
          value={committedToday}
        />

        <LimitValue
          label="Remaining Today"
          value={remainingToday}
        />
      </div>

      <div className="mt-5 rounded-control bg-elevated p-3">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck size={14} />

          <span className="text-[10px] font-semibold uppercase tracking-wider">
            Contract Enforcement
          </span>
        </div>

        <p className="mt-2 text-[10px] leading-4 text-muted">
          Payment requests must satisfy both the per-transaction limit and the
          remaining UTC daily allowance before transfer scheduling.
        </p>
      </div>

      <p className="mt-4 text-[9px] text-muted">
        Limit updates require an owner-signed transaction and are implemented
        in Issue #13.
      </p>
    </Card>
  );
}

function LimitValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-control bg-elevated p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </p>

      <p className="font-technical mt-2 text-lg">
        {value}{" "}
        <span className="text-[10px] text-muted">
          NEAR
        </span>
      </p>
    </div>
  );
}
