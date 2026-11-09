import { ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { SecurityPoliciesDashboard } from "@/components/security-policies/security-policies-dashboard";
import { Badge } from "@/components/ui/badge";

export default function SecurityPoliciesPage() {
  return (
    <AppShell
      activeSection="security-policies"
      title="Security Policies"
      subtitle="Review owner-controlled spending rules enforced by the Nocturne Guard."
    >
      <div className="mx-auto w-full max-w-[1440px] space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">
                <ShieldCheck size={11} />
                Contract Policy
              </Badge>

              <span className="font-technical rounded bg-elevated px-2 py-1 text-[9px] text-muted">
                NEAR Testnet
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Security Policies
            </h1>

            <p className="mt-1 text-xs leading-5 text-muted">
              Review spending limits, recipient eligibility and Emergency
              Freeze state. Policy mutations require owner authorisation.
            </p>
          </div>

          <div className="font-technical flex items-center gap-2 rounded-control bg-card px-3 py-2 text-[9px] text-muted">
            <span className="size-1.5 rounded-full bg-cyan" />
            Read-only contract view
          </div>
        </section>

        <SecurityPoliciesDashboard />
      </div>
    </AppShell>
  );
}
