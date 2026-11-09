import { AppShell } from "@/components/layout/app-shell";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";

export default function OverviewPage() {
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
              NEAR Testnet
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Overview
          </h1>

          <p className="mt-1 text-xs leading-5 text-muted">
            Monitor AI treasury activity and spending permissions.
          </p>
        </div>

        <OverviewDashboard />
      </div>
    </AppShell>
  );
}
