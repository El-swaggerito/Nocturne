import { LockKeyhole, LockOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type FreezeCardProps = {
  frozen: boolean;
  onFreeze: () => void;
  onUnfreeze: () => void;
};

export function FreezeCard({
  frozen,
  onFreeze,
  onUnfreeze,
}: FreezeCardProps) {
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
          Freezing Nocturne blocks new payment requests.
        </p>

        <p className="text-[10px] leading-4 text-muted">
          It does not cancel transfers already scheduled before the freeze,
          revoke the agent function-call key, or reverse confirmed payments.
        </p>

        <p className="font-technical text-[9px] text-primary">
          Contract method: set_frozen({frozen ? "false" : "true"})
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          variant="danger"
          disabled={frozen}
          onClick={onFreeze}
        >
          <LockKeyhole size={14} />
          Emergency Freeze
        </Button>

        <Button
          variant="secondary"
          disabled={!frozen}
          onClick={onUnfreeze}
        >
          <LockOpen size={14} />
          Unfreeze Payments
        </Button>
      </div>

      <p className="mt-3 text-[9px] text-muted">
        Demo-only state change. No NEAR transaction is submitted.
      </p>
    </Card>
  );
}
