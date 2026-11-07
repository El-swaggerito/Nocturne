"use client";

import { Plus, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ApprovedRecipient } from "@/data/demo-security-policies";

type RecipientsCardProps = {
  recipients: ApprovedRecipient[];
  onAdd: () => void;
  onRemove: (recipient: ApprovedRecipient) => void;
};

export function RecipientsCard({
  recipients,
  onAdd,
  onRemove,
}: RecipientsCardProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Approved Recipients</h2>
            <Badge variant="cyan">{recipients.length} active</Badge>
          </div>

          <p className="mt-1 text-xs text-muted">
            Only approved NEAR accounts can receive Guard transfers.
          </p>
        </div>

        <Button variant="secondary" onClick={onAdd}>
          <Plus size={14} />
          Add Recipient
        </Button>
      </div>

      <div className="relative mt-5">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />

        <input
          placeholder="Search approved recipients..."
          className="h-10 w-full rounded-control border border-border bg-elevated pl-9 pr-3 text-xs outline-none focus:border-primary"
        />
      </div>

      <div className="mt-4 space-y-2">
        {recipients.map((recipient) => (
          <div
            key={recipient.accountId}
            className="flex items-center justify-between gap-3 rounded-control bg-elevated p-3"
          >
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-technical truncate text-[10px] font-medium">
                  {recipient.accountId}
                </span>

                <Badge variant="success">Approved</Badge>
              </div>

              <p className="mt-1 text-[10px] text-muted">
                {recipient.label}
              </p>
            </div>

            <button
              type="button"
              title="Remove recipient"
              onClick={() => onRemove(recipient)}
              className="flex size-8 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-danger-bg hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-control bg-background p-3 text-[10px] leading-4 text-muted">
        Adding a recipient does not send funds. It only makes that account
        eligible for future requests that also satisfy every other contract
        policy.
      </p>
    </Card>
  );
}
