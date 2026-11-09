import { LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function FreezeCard({
  frozen,
}: {
  frozen: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-control bg-danger-bg text-danger">
              <LockKeyhole size={16} />
            </div>

            <h2 className="text-lg font-semibold">
              Emergency Freeze
            </h2>
          </div>

          <p className="mt-1 text-xs text-muted">
            Owner-only contract control for new payment requests.
          </p>
        </div>

        <Badge variant={frozen ? "danger" : "success"}>
          {frozen ? "Frozen" : "Unfrozen"}
        </Badge>
      </div>

      <div className="mt-5 space-y-2 rounded-control bg-background p-4">
        <p className="text-xs font-medium leading-5">
          {frozen
            ? "New payment requests are currently blocked."
            : "New payment requests may be evaluated against policy."}
        </p>

        <p className="text-[10px] leading-4 text-muted">
          Freezing does not cancel transfers already scheduled before the
          freeze, revoke the agent function-call key, or reverse confirmed
          payments.
        </p>
      </div>

      <p className="mt-4 text-[9px] text-muted">
        Freeze and unfreeze signing are implemented in Issue #13.
      </p>
    </Card>
  );
}
