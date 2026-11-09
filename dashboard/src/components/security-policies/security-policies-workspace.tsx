"use client";

import { AgentAccessCard } from "@/components/security-policies/agent-access-card";
import { EnforcementFlow } from "@/components/security-policies/enforcement-flow";
import { FreezeCard } from "@/components/security-policies/freeze-card";
import { LimitsCard } from "@/components/security-policies/limits-card";
import { PolicyMetrics } from "@/components/security-policies/policy-metrics";
import { RecipientsCard } from "@/components/security-policies/recipients-card";
import type {
  PolicyView,
  SpendingView,
} from "@/lib/contract-types";
import { formatYoctoNear } from "@/lib/format-near";

export function SecurityPoliciesWorkspace({
  owner,
  agent,
  policy,
  spending,
}: {
  owner: string;
  agent: string;
  policy: PolicyView;
  spending: SpendingView;
}) {
  const dailyLimit = formatYoctoNear(policy.daily_limit);
  const transactionLimit = formatYoctoNear(
    policy.per_transaction_limit,
  );

  return (
    <div className="space-y-5">
      <PolicyMetrics
        dailyLimit={dailyLimit}
        transactionLimit={transactionLimit}
        recipientCount={policy.approved_recipients.length}
        frozen={policy.frozen}
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
            committedToday={formatYoctoNear(
              spending.daily_committed,
            )}
            remainingToday={formatYoctoNear(
              spending.remaining_daily,
            )}
          />

          <FreezeCard frozen={policy.frozen} />
        </div>

        <div className="space-y-4">
          <RecipientsCard
            recipients={policy.approved_recipients}
          />

          <AgentAccessCard
            owner={owner}
            agent={agent}
          />
        </div>
      </div>

      <EnforcementFlow />
    </div>
  );
}
