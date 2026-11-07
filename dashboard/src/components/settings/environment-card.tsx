import { TerminalSquare } from "lucide-react";

import { SettingsCard } from "@/components/settings/settings-card";

const values = [
  ["App Environment", "Next.js Demo UI"],
  ["Network Mode", "NEAR Testnet"],
  ["Contract ABI", "Not connected"],
  ["Build Metadata", "Not reported"],
];

export function EnvironmentCard() {
  return (
    <SettingsCard
      title="Application Environment"
      eyebrow="Frontend State"
      icon={<TerminalSquare size={16} className="text-muted" />}
    >
      <div className="grid grid-cols-2 gap-2">
        {values.map(([label, value]) => (
          <div
            key={label}
            className="rounded-control bg-elevated p-2.5"
          >
            <p className="text-[8px] font-semibold uppercase tracking-wider text-muted">
              {label}
            </p>

            <p className="font-technical mt-1 text-[9px]">{value}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[9px] leading-4 text-faint">
        These values describe the current frontend demonstration and should not
        be interpreted as live deployment telemetry.
      </p>
    </SettingsCard>
  );
}
