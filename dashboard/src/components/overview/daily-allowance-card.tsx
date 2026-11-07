import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type DailyAllowanceCardProps = {
  committed: string;
  remaining: string;
  dailyLimit: string;
  percentageUsed: number;
  transactionLimit: string;
  approvedRecipients: number;
};

export function DailyAllowanceCard({
  committed,
  remaining,
  dailyLimit,
  percentageUsed,
  transactionLimit,
  approvedRecipients,
}: DailyAllowanceCardProps) {
  return (
    <Card className="flex min-h-[260px] flex-col justify-between p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-control bg-elevated text-cyan">
              <ShieldCheck size={17} />
            </div>

            <h2 className="text-[15px] font-semibold">
              Daily Allowance
            </h2>
          </div>

          <Badge variant="primary">On-chain policy</Badge>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Committed Today
            </p>

            <p className="font-technical mt-1 text-lg font-medium">
              {committed}{" "}
              <span className="text-[10px] text-muted">NEAR</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan">
              Remaining
            </p>

            <p className="font-technical mt-1 text-lg font-medium text-cyan">
              {remaining}{" "}
              <span className="text-[10px] text-muted">NEAR</span>
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div
            className="h-2 overflow-hidden rounded-full bg-elevated"
            aria-label={`${percentageUsed}% of daily allowance used`}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${percentageUsed}%` }}
            />
          </div>

          <div className="font-technical mt-2 flex items-center justify-between gap-4 text-[10px] text-muted">
            <span>
              {percentageUsed}% used ({committed} / {dailyLimit} NEAR)
            </span>

            <span>Resets 00:00 UTC</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        <span className="font-technical rounded bg-elevated px-2 py-1 text-[10px]">
          Per-tx: {transactionLimit} NEAR
        </span>

        <span className="font-technical rounded bg-elevated px-2 py-1 text-[10px]">
          Recipients: {approvedRecipients}
        </span>
      </div>
    </Card>
  );
}
