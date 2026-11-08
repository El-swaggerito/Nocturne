import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type SecurityStatusCardProps = {
  frozen: boolean;
  owner: string;
  agent: string;
};

function shortenAccount(accountId: string) {
  if (accountId.length <= 24) return accountId;

  return `${accountId.slice(0, 11)}...${accountId.slice(-9)}`;
}

export function SecurityStatusCard({
  frozen,
  owner,
  agent,
}: SecurityStatusCardProps) {
  return (
    <Card className="flex min-h-[260px] flex-col justify-between p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-control bg-elevated text-primary">
              <ShieldCheck size={17} />
            </div>

            <h2 className="text-[15px] font-semibold">
              Wallet Security Status
            </h2>
          </div>

          <Badge variant={frozen ? "danger" : "success"}>
            {frozen ? "Frozen" : "Active"}
          </Badge>
        </div>

        <div className="font-technical mt-6 space-y-2 text-[10px]">
          <div className="flex items-center justify-between gap-4 rounded bg-elevated/60 px-3 py-2">
            <span className="text-muted">Spending Policy</span>
            <span>Enforced On-Chain</span>
          </div>

          <div className="flex items-center justify-between gap-4 rounded bg-elevated/60 px-3 py-2">
            <span className="text-muted">Freeze Status</span>
            <span className={frozen ? "text-danger" : "text-cyan"}>
              {frozen ? "Frozen" : "Unfrozen"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 rounded bg-elevated/60 px-3 py-2">
            <span className="text-muted">Owner</span>
            <span title={owner}>{shortenAccount(owner)}</span>
          </div>

          <div className="flex items-center justify-between gap-4 rounded bg-elevated/60 px-3 py-2">
            <span className="text-muted">Agent</span>
            <span title={agent}>{shortenAccount(agent)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted">
        Owner controls are read-only in Issue #12. Policy mutations and
        freeze/unfreeze signing are implemented in Issue #13.
      </div>
    </Card>
  );
}
