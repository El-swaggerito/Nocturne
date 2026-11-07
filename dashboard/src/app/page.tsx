import { AppShell } from "@/components/layout/app-shell";
import { AiActivity } from "@/components/overview/ai-activity";
import { DailyAllowanceCard } from "@/components/overview/daily-allowance-card";
import { RecentPayments } from "@/components/overview/recent-payments";
import { SecurityStatusCard } from "@/components/overview/security-status-card";
import { TreasuryCard } from "@/components/overview/treasury-card";
import {
  demoPayments,
  overviewDemoData,
} from "@/data/demo-overview";

export default function OverviewPage() {
  const { treasury, allowance, agent, proposal } = overviewDemoData;

  return (
    <AppShell
      activeSection="overview"
      title="Overview"
      subtitle="Monitor AI treasury activity and spending permissions."
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-5 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan" />
            <span className="font-technical text-[9px] uppercase tracking-wider text-cyan">
              NEAR Testnet · Demo
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Overview
          </h1>

          <p className="mt-1 text-xs leading-5 text-muted">
            Monitor AI treasury activity and spending permissions.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TreasuryCard
            balance={treasury.balance}
            spendable={treasury.spendable}
            reserved={treasury.reserved}
          />

          <DailyAllowanceCard
            committed={allowance.committed}
            remaining={allowance.remaining}
            dailyLimit={allowance.dailyLimit}
            percentageUsed={allowance.percentageUsed}
            transactionLimit={allowance.transactionLimit}
            approvedRecipients={allowance.approvedRecipients}
          />

          <div className="md:col-span-2 xl:col-span-1">
            <SecurityStatusCard />
          </div>
        </section>

        <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
          <RecentPayments payments={demoPayments} />

          <AiActivity
            agentId={agent.accountId}
            proposal={proposal}
          />
        </div>
      </div>
    </AppShell>
  );
}
