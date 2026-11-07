"use client";

import { useState } from "react";
import { Check, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SettingsCard } from "@/components/settings/settings-card";

export function SessionCard() {
  const [cleared, setCleared] = useState(false);

  function clearDemoState() {
    const keys = Object.keys(window.localStorage).filter((key) =>
      key.startsWith("nocturne:"),
    );

    keys.forEach((key) => {
      window.localStorage.removeItem(key);
    });

    setCleared(true);

    window.setTimeout(() => {
      setCleared(false);
    }, 1500);
  }

  return (
    <SettingsCard
      title="Session State"
      eyebrow="Local Browser State"
      icon={<RefreshCcw size={16} className="text-muted" />}
    >
      <p className="text-[10px] leading-4 text-muted">
        Manage temporary frontend demonstration data. No action in this card
        modifies smart-contract state or NEAR access keys.
      </p>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        <Button variant="secondary" disabled>
          Disconnect Wallet
        </Button>

        <Button variant="secondary" onClick={clearDemoState}>
          {cleared ? <Check size={13} /> : <RefreshCcw size={13} />}
          {cleared ? "Demo Data Cleared" : "Clear Local Demo Data"}
        </Button>
      </div>

      <p className="mt-3 text-[9px] text-faint">
        Wallet disconnection will become available when wallet integration is
        implemented.
      </p>
    </SettingsCard>
  );
}
