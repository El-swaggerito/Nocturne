import { Landmark, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type TreasuryCardProps = {
  balance: string;
  spendable: string;
  reserved: string;
};

export function TreasuryCard({
  balance,
  spendable,
  reserved,
}: TreasuryCardProps) {
  return (
    <Card className="flex min-h-[260px] flex-col justify-between p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-control bg-elevated text-primary">
              <Landmark size={17} />
            </div>

            <h2 className="text-[15px] font-semibold">
              Treasury Balance
            </h2>
          </div>

          <Badge variant="cyan">Live RPC</Badge>
        </div>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="financial-hero">{balance}</span>

          <span className="font-technical rounded bg-elevated px-2 py-0.5 text-[10px] text-primary">
            NEAR
          </span>
        </div>

        <div className="mt-5 space-y-2 rounded-control border border-border bg-background/70 p-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted">Remaining Daily Allowance</span>
            <span className="font-technical text-[11px]">
              {spendable} NEAR
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted">Reserved (Pending)</span>
            <span className="font-technical text-[11px] text-cyan">
              {reserved} NEAR
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted">
        <ShieldCheck size={14} className="text-cyan" />
        <span>Guard account state from NEAR RPC</span>
      </div>
    </Card>
  );
}
