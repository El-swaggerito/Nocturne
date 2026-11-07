"use client";

import { useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FreezeDialog } from "@/components/overview/freeze-dialog";

export function SecurityStatusCard() {
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);

  return (
    <>
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

            <Badge variant="success">Active</Badge>
          </div>

          <div className="font-technical mt-6 space-y-2 text-[10px]">
            <div className="flex items-center justify-between gap-4 rounded bg-elevated/60 px-3 py-2">
              <span className="text-muted">Spending Policy</span>
              <span>Enforced On-Chain</span>
            </div>

            <div className="flex items-center justify-between gap-4 rounded bg-elevated/60 px-3 py-2">
              <span className="text-muted">AI Agent Access</span>
              <span>Restricted Function-Call</span>
            </div>

            <div className="flex items-center justify-between gap-4 rounded bg-elevated/60 px-3 py-2">
              <span className="text-muted">Freeze Status</span>
              <span className="text-cyan">Unfrozen</span>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setFreezeDialogOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-control border border-danger/30 bg-elevated px-3 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-bg"
          >
            <LockKeyhole size={16} />
            Emergency Freeze
          </button>

          <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-muted">
            Requires owner wallet authorisation
          </p>
        </div>
      </Card>

      <FreezeDialog
        open={freezeDialogOpen}
        onClose={() => setFreezeDialogOpen(false)}
      />
    </>
  );
}
