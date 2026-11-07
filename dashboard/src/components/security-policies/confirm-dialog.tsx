"use client";

import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  dangerous?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  dangerous = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-card border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={
                dangerous
                  ? "flex size-9 items-center justify-center rounded-full bg-danger-bg text-danger"
                  : "flex size-9 items-center justify-center rounded-full bg-primary-muted text-primary"
              }
            >
              <AlertTriangle size={17} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">{title}</h2>

              <p className="mt-2 text-xs leading-5 text-muted">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-control text-muted hover:bg-elevated"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 rounded-control bg-elevated p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-muted">Owner</span>
            <span className="font-technical text-[9px]">
              owner.nocturne.testnet
            </span>
          </div>

          <p className="mt-2 text-[9px] text-faint">
            Demo UI only. This does not open a wallet or submit a transaction.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant={dangerous ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
