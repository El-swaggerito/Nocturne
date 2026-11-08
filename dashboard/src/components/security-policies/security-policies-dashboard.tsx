"use client";

import {
  AlertTriangle,
  LoaderCircle,
  ServerOff,
} from "lucide-react";

import { SecurityPoliciesWorkspace } from "@/components/security-policies/security-policies-workspace";
import { useGuardState } from "@/hooks/use-guard-state";

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
          className={
            kind === "error"
              ? "text-danger"
              : "text-cyan"
          }
        />

        <div>
          <h2 className="text-sm font-semibold">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted">
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}

export function SecurityPoliciesDashboard() {
  const {
    data,
    configured,
    loading,
    error,
  } = useGuardState();

  if (!configured) {
    return (
      <StateNotice
        kind="warning"
        title="Guard contract not configured"
        message="Set NEXT_PUBLIC_GUARD_CONTRACT_ID after the Nocturne Guard is deployed to testnet. No live policy values are being shown."
      />
    );
  }

  if (loading && !data) {
    return (
      <StateNotice
        kind="loading"
        title="Loading security policy"
        message="Reading owner, agent, limits, freeze status and approved recipients from NEAR RPC."
      />
    );
  }

  if (error || !data) {
    return (
      <StateNotice
        kind="error"
        title="Unable to load security policy"
        message={
          error ??
          "The configured Guard did not return the expected policy state."
        }
      />
    );
  }

  return (
    <SecurityPoliciesWorkspace
      owner={data.owner}
      agent={data.agent}
      policy={data.policy}
      spending={data.spending}
    />
  );
}
