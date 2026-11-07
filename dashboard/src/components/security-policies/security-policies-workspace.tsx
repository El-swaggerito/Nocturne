"use client";

import { useState } from "react";

import { AddRecipientDialog } from "@/components/security-policies/add-recipient-dialog";
import { AgentAccessCard } from "@/components/security-policies/agent-access-card";
import { ConfirmDialog } from "@/components/security-policies/confirm-dialog";
import { EnforcementFlow } from "@/components/security-policies/enforcement-flow";
import { FreezeCard } from "@/components/security-policies/freeze-card";
import { LimitsCard } from "@/components/security-policies/limits-card";
import { PolicyMetrics } from "@/components/security-policies/policy-metrics";
import { RecipientsCard } from "@/components/security-policies/recipients-card";
import {
  initialApprovedRecipients,
  initialPolicy,
  type ApprovedRecipient,
} from "@/data/demo-security-policies";

type Confirmation =
  | null
  | {
      type: "limits";
    }
  | {
      type: "freeze";
    }
  | {
      type: "unfreeze";
    }
  | {
      type: "remove";
      recipient: ApprovedRecipient;
    };

export function SecurityPoliciesWorkspace() {
  const [dailyLimit, setDailyLimit] = useState(
    initialPolicy.dailyLimit,
  );

  const [transactionLimit, setTransactionLimit] = useState(
    initialPolicy.transactionLimit,
  );

  const [frozen, setFrozen] = useState(initialPolicy.frozen);

  const [recipients, setRecipients] = useState(
    initialApprovedRecipients,
  );

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [confirmation, setConfirmation] =
    useState<Confirmation>(null);

  return (
    <div className="space-y-5">
      <PolicyMetrics
        dailyLimit={dailyLimit}
        transactionLimit={transactionLimit}
        recipientCount={recipients.length}
        frozen={frozen}
      />

      <div className="rounded-card border border-border bg-elevated p-4">
        <p className="text-xs font-medium">
          Owner-controlled policy
        </p>

        <p className="mt-1 text-[10px] leading-4 text-muted">
          The agent may propose payments. Only the owner may change spending
          limits, approved recipients or the Emergency Freeze state.
        </p>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <LimitsCard
            dailyLimit={dailyLimit}
            transactionLimit={transactionLimit}
            onDailyLimitChange={setDailyLimit}
            onTransactionLimitChange={setTransactionLimit}
            onReview={() => setConfirmation({ type: "limits" })}
          />

          <FreezeCard
            frozen={frozen}
            onFreeze={() => setConfirmation({ type: "freeze" })}
            onUnfreeze={() => setConfirmation({ type: "unfreeze" })}
          />
        </div>

        <div className="space-y-4">
          <RecipientsCard
            recipients={recipients}
            onAdd={() => setAddDialogOpen(true)}
            onRemove={(recipient) =>
              setConfirmation({
                type: "remove",
                recipient,
              })
            }
          />

          <AgentAccessCard />
        </div>
      </div>

      <EnforcementFlow />

      <AddRecipientDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={(recipient) => {
          if (
            recipients.some(
              (item) => item.accountId === recipient.accountId,
            )
          ) {
            return;
          }

          setRecipients((current) => [...current, recipient]);
        }}
      />

      <ConfirmDialog
        open={confirmation?.type === "limits"}
        title="Review Spending Limit Update"
        description={`Daily limit: ${dailyLimit} NEAR. Per-transaction limit: ${transactionLimit} NEAR. A real update will later require the owner wallet to sign set_limits.`}
        confirmLabel="Apply Demo Limits"
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          // Local UI state is already updated by the form.
        }}
      />

      <ConfirmDialog
        open={confirmation?.type === "freeze"}
        title="Confirm Emergency Freeze"
        description="Freezing blocks new payment requests. It does not cancel transfers already scheduled before the freeze and does not revoke the agent function-call key."
        confirmLabel="Freeze Demo State"
        dangerous
        onClose={() => setConfirmation(null)}
        onConfirm={() => setFrozen(true)}
      />

      <ConfirmDialog
        open={confirmation?.type === "unfreeze"}
        title="Confirm Unfreeze"
        description="Unfreezing allows new payment requests to be evaluated against the configured policy again."
        confirmLabel="Unfreeze Demo State"
        onClose={() => setConfirmation(null)}
        onConfirm={() => setFrozen(false)}
      />

      <ConfirmDialog
        open={confirmation?.type === "remove"}
        title="Remove Approved Recipient"
        description={
          confirmation?.type === "remove"
            ? `Remove ${confirmation.recipient.accountId} from the demo allowlist. A real removal later requires an owner-signed remove_approved_recipient transaction.`
            : ""
        }
        confirmLabel="Remove Demo Recipient"
        dangerous
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation?.type !== "remove") {
            return;
          }

          const accountId = confirmation.recipient.accountId;

          setRecipients((current) =>
            current.filter(
              (recipient) => recipient.accountId !== accountId,
            ),
          );
        }}
      />
    </div>
  );
}
