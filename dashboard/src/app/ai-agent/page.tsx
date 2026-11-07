import { AppShell } from "@/components/layout/app-shell";
import { AiAgentWorkspace } from "@/components/ai-agent/ai-agent-workspace";

export default function AiAgentPage() {
  return (
    <AppShell
      activeSection="ai-agent"
      title="AI Agent"
      subtitle="AI agents propose transactions. Smart contracts decide whether they are authorised."
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
            AI Agent
          </h1>

          <p className="mt-1 max-w-md text-xs leading-5 text-muted">
            Process untrusted invoices, inspect AI proposals and preview
            contract policy decisions.
          </p>
        </div>

        <AiAgentWorkspace />
      </div>
    </AppShell>
  );
}
