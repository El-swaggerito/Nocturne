"use client";

import { AgentAccessCard } from "@/components/security-policies/agent-access-card";
import { EnforcementFlow } from "@/components/security-policies/enforcement-flow";
import { FreezeCard } from "@/components/security-policies/freeze-card";
import { LimitsCard } from "@/components/security-policies/limits-card";
import { PolicyMetrics } from "@/components/security-policies/policy-metrics";
import { RecipientsCard } from "@/components/security-policies/recipients-card";
import type { WalletSelector } from "@near-wallet-selector/core";

import type {
  PolicyView,
  SpendingView,
} from "@/lib/contract-types";
import { formatYoctoNear } from "@/lib/format-near";
import type { OwnerAccessState } from "@/lib/owner-access";

export function SecurityPoliciesWorkspace({
  owner,
  agent,
  policy,
  spending,
  ownerAccess,
  walletLoading,
  connectedAccountId,
  selector,
  refresh,
}: {
  owner: string;
  agent: string;
  policy: PolicyView;
  spending: SpendingView;
  ownerAccess: OwnerAccessState;
  walletLoading: boolean;
  connectedAccountId: string | null;
  selector: WalletSelector | null;
  refresh: () => Promise<void>;
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

      <OwnerAccessNotice
        owner={owner}
        access={ownerAccess}
        walletLoading={walletLoading}
        connectedAccountId={connectedAccountId}
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
            ownerAccess={ownerAccess}
            selector={selector}
            accountId={connectedAccountId}
            refresh={refresh}
          />

          <FreezeCard
            frozen={policy.frozen}
            ownerAccess={ownerAccess}
            selector={selector}
            accountId={connectedAccountId}
            refresh={refresh}
          />
        </div>

        <div className="space-y-4">
          <RecipientsCard
            recipients={policy.approved_recipients}
            ownerAccess={ownerAccess}
            selector={selector}
            accountId={connectedAccountId}
            refresh={refresh}
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


function OwnerAccessNotice({
  owner,
  access,
  walletLoading,
  connectedAccountId,
}: {
  owner: string;
  access: OwnerAccessState;
  walletLoading: boolean;
  connectedAccountId: string | null;
}) {
  if (walletLoading) {
    return (
      <div className="rounded-card border border-border bg-elevated p-4">
        <p className="text-xs font-medium">
          Checking wallet authorisation
        </p>
        <p className="mt-1 text-[10px] leading-4 text-muted">
          Waiting for the connected NEAR wallet account.
        </p>
      </div>
    );
  }

  if (access === "owner") {
    return (
      <div className="rounded-card border border-cyan/30 bg-elevated p-4">
        <p className="text-xs font-medium text-cyan">
          Owner wallet connected
        </p>
        <p className="mt-1 text-[10px] leading-4 text-muted">
          {connectedAccountId} matches the Guard owner. Owner controls will
          require explicit wallet approval before any transaction is submitted.
        </p>
      </div>
    );
  }

  if (access === "non-owner") {
    return (
      <div className="rounded-card border border-danger/30 bg-elevated p-4">
        <p className="text-xs font-medium text-danger">
          Connected wallet is not the Guard owner
        </p>
        <p className="mt-1 text-[10px] leading-4 text-muted">
          Connected: {connectedAccountId}. Guard owner: {owner}. Policy state
          remains viewable, but owner mutations must not be presented as
          authorised.
        </p>
      </div>
    );
  }

  if (access === "disconnected") {
    return (
      <div className="rounded-card border border-border bg-elevated p-4">
        <p className="text-xs font-medium">
          Owner wallet not connected
        </p>
        <p className="mt-1 text-[10px] leading-4 text-muted">
          Connect the Guard owner account to access owner-only controls.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-elevated p-4">
      <p className="text-xs font-medium">
        Owner authorisation unavailable
      </p>
      <p className="mt-1 text-[10px] leading-4 text-muted">
        Live Guard owner state could not be established.
      </p>
    </div>
  );
}
