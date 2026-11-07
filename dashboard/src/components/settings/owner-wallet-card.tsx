"use client";

import { useState } from "react";
import { Check, Copy, Info, LockKeyhole, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "@/components/settings/settings-card";
import { settingsDemoData } from "@/data/demo-settings";

export function OwnerWalletCard() {
  const [copied, setCopied] = useState(false);

  const accountId = settingsDemoData.owner.accountId;

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(accountId);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <SettingsCard
      title="Owner Wallet"
      eyebrow="Role: Treasury Owner"
      icon={<WalletCards size={16} className="text-primary" />}
      status={<Badge variant="cyan">Demo Signer</Badge>}
    >
      <div className="flex items-center justify-between gap-3 rounded-control bg-elevated p-3">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">
            Owner Account
          </p>

          <p className="font-technical mt-1 truncate text-[10px]">
            {accountId}
          </p>
        </div>

        <Button variant="secondary" onClick={copyAccount}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <InfoBox label="Network" value="NEAR Testnet" />
        <InfoBox label="Permission" value="Owner wallet signer" />
      </div>

      <p className="mt-4 text-[10px] leading-4 text-muted">
        Owner wallet authorisation will be required for policy changes,
        recipient management and Emergency Freeze operations once wallet
        integration is enabled.
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-control bg-background p-3 text-[10px] leading-4 text-muted">
        <Info size={14} className="mt-0.5 shrink-0 text-cyan" />

        <p>
          Nocturne does not store the owner&apos;s seed phrase, private key or
          full-access key material in the application.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-[10px] text-muted">
        <LockKeyhole size={13} className="text-cyan" />
        <span>External wallet signer required for real transactions</span>
      </div>
    </SettingsCard>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-control bg-background p-2.5">
      <p className="text-[8px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>

      <p className="font-technical mt-1 text-[9px]">{value}</p>
    </div>
  );
}
