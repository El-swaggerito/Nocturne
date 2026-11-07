"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ApprovedRecipient } from "@/data/demo-security-policies";

type AddRecipientDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (recipient: ApprovedRecipient) => void;
};

export function AddRecipientDialog({
  open,
  onClose,
  onAdd,
}: AddRecipientDialogProps) {
  const [accountId, setAccountId] = useState("");
  const [label, setLabel] = useState("");

  if (!open) {
    return null;
  }

  const valid =
    accountId.trim().length > 0 &&
    label.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-card border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Allowlist Mutation
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              Add Approved Recipient
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-control text-muted hover:bg-elevated"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold">
              NEAR Account ID
            </label>

            <input
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              placeholder="data-oracle.testnet"
              className="font-technical mt-2 h-10 w-full rounded-control border border-border bg-elevated px-3 text-xs outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">
              Service Label
            </label>

            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Data Oracle"
              className="mt-2 h-10 w-full rounded-control border border-border bg-elevated px-3 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="rounded-control bg-elevated p-3 text-[10px] leading-4 text-muted">
            Adding this recipient would require an owner-signed
            <code className="font-technical mx-1 text-primary">
              add_approved_recipient
            </code>
            transaction when blockchain integration is enabled.
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button
            disabled={!valid}
            onClick={() => {
              onAdd({
                accountId: accountId.trim(),
                label: label.trim(),
              });
              setAccountId("");
              setLabel("");
              onClose();
            }}
          >
            <Plus size={14} />
            Add Demo Recipient
          </Button>
        </div>
      </div>
    </div>
  );
}
