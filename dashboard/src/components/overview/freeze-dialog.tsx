"use client";

import { LockKeyhole, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type FreezeDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function FreezeDialog({
  open,
  onClose,
}: FreezeDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="freeze-dialog-title"
        className="w-full max-w-[480px] rounded-card border border-danger/40 bg-card p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
              <LockKeyhole size={19} />
            </div>

            <div>
              <h2
                id="freeze-dialog-title"
                className="text-[15px] font-semibold"
              >
                Confirm Emergency Freeze
              </h2>

              <p className="font-technical mt-1 text-[9px] uppercase tracking-wider text-danger">
                Owner wallet signature required
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close freeze dialog"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-control text-muted hover:bg-elevated hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm leading-6 text-muted">
          <p>
            Freezing Nocturne blocks new payment requests at the contract
            level.
          </p>

          <p>
            It does not revoke the agent access key, reverse confirmed
            payments or cancel transfers that were already scheduled before
            the freeze.
          </p>
        </div>

        <div className="font-technical mt-5 rounded-control border border-border bg-background p-3 text-[11px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted">Owner</span>
            <span>owner.nocturne.testnet</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={() => {
              onClose();
            }}
          >
            <LockKeyhole size={14} />
            Authorise Freeze
          </Button>
        </div>

        <p className="mt-3 text-right text-[10px] text-faint">
          Demo UI only. No blockchain transaction is submitted.
        </p>
      </div>
    </div>
  );
}
