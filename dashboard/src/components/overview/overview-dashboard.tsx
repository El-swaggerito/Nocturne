"use client";

import { AlertTriangle, LoaderCircle, ServerOff } from "lucide-react";

import { AiActivity } from "@/components/overview/ai-activity";
import { DailyAllowanceCard } from "@/components/overview/daily-allowance-card";
import { RecentPayments } from "@/components/overview/recent-payments";
import { SecurityStatusCard } from "@/components/overview/security-status-card";
import { TreasuryCard } from "@/components/overview/treasury-card";
import { overviewDemoData } from "@/data/demo-overview";
import { useGuardState } from "@/hooks/use-guard-state";
import {
  formatYoctoNear,
  percentageOfLimit,
} from "@/lib/format-near";

function StateNotice({
  title,
  message,
  kind,
}: {
  title: string;
  message: string;
  kind: "loading" | "warning" | "error";
}) {
  const Icon =
    kind === "loading"
      ? LoaderCircle
      : kind === "warning"
        ? ServerOff
        : AlertTriangle;

  return (
    <section className="rounded-card border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <Icon
          size={18}
          className={kind === "error" ? "text-danger" : "text-cyan"}
        />

        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}

export function OverviewDashboard() {
  const {
    data,
    configured,
    loading,
    error,
  } = useGuardState();

  const { agent, proposal } = overviewDemoData;

  if (!configured) {
    return (
      <>
        <StateNotice
          kind="warning"
          title="Guard contract not configured"
          message="Set NEXT_PUBLIC_GUARD_CONTRACT_ID after the Nocturne Guard is deployed to testnet. No live treasury or policy values are being shown."
        />

        <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
          <AiActivity
            agentId={agent.accountId}
            proposal={proposal}
          />
        </div>
      </>
    );
  }

  if (loading && !data) {
    return (
      <StateNotice
        kind="loading"
        title="Loading Guard state"
        message="Reading treasury balance and policy state from NEAR RPC."
      />
    );
  }

  if (error || !data) {
    return (
      <StateNotice
        kind="error"
        title="Unable to load Guard state"
        message={
          error ??
          "The configured Guard did not return the expected contract state."
        }
      />
    );
  }

  const balance = formatYoctoNear(data.balanceYocto);
  const pending = formatYoctoNear(data.spending.pending_total);
  const remainingDaily = formatYoctoNear(
    data.spending.remaining_daily,
  );
  const committed = formatYoctoNear(
    data.spending.daily_committed,
  );
  const dailyLimit = formatYoctoNear(
    data.policy.daily_limit,
  );
  const transactionLimit = formatYoctoNear(
    data.policy.per_transaction_limit,
  );
  const percentageUsed = percentageOfLimit(
    data.spending.daily_committed,
    data.policy.daily_limit,
  );

  return (
    <>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TreasuryCard
          balance={balance}
          spendable={remainingDaily}
          reserved={pending}
        />

        <DailyAllowanceCard
          committed={committed}
          remaining={remainingDaily}
          dailyLimit={dailyLimit}
          percentageUsed={percentageUsed}
          transactionLimit={transactionLimit}
          approvedRecipients={
            data.policy.approved_recipients.length
          }
        />

        <div className="md:col-span-2 xl:col-span-1">
          <SecurityStatusCard
            frozen={data.policy.frozen}
            owner={data.owner}
            agent={data.agent}
          />
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <RecentPayments payments={data.payments} />

        <AiActivity
          agentId={data.agent}
          proposal={proposal}
        />
      </div>
    </>
  );
}
