import { Settings as SettingsIcon } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { AgentIdentityCard } from "@/components/settings/agent-identity-card";
import { AiInferenceCard } from "@/components/settings/ai-inference-card";
import { EnvironmentCard } from "@/components/settings/environment-card";
import { GuardContractCard } from "@/components/settings/guard-contract-card";
import { NetworkCard } from "@/components/settings/network-card";
import { OwnerWalletCard } from "@/components/settings/owner-wallet-card";
import { SecretsPanel } from "@/components/settings/secrets-panel";
import { SecurityConfigurationCard } from "@/components/settings/security-configuration-card";
import { SessionCard } from "@/components/settings/session-card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <AppShell
      activeSection="settings"
      title="Settings"
      subtitle="Review wallet, contract, agent and network configuration."
    >
      <div className="mx-auto w-full max-w-[1440px] space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <SettingsIcon size={16} className="text-primary" />

              <h1 className="text-2xl font-semibold tracking-tight">
                Settings
              </h1>

              <Badge variant="cyan">
                Testnet Demo
              </Badge>
            </div>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-muted">
              Review Nocturne&apos;s wallet roles, Guard interface, agent
              permissions and public network configuration.
            </p>
          </div>

          <div className="font-technical flex items-center gap-2 rounded-control bg-card px-3 py-2 text-[9px] text-muted">
            <span className="size-1.5 rounded-full bg-cyan" />
            Environment: Demonstration
          </div>
        </section>

        <div className="grid items-start gap-4 xl:grid-cols-2">
          <div className="space-y-4">
            <OwnerWalletCard />
            <GuardContractCard />
            <SecurityConfigurationCard />
          </div>

          <div className="space-y-4">
            <AgentIdentityCard />
            <AiInferenceCard />
            <NetworkCard />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <EnvironmentCard />
          <SessionCard />
        </div>

        <SecretsPanel />
      </div>
    </AppShell>
  );
}
