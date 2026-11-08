"use client";

import { Bell, ShieldCheck, UserRound } from "lucide-react";

import { WalletConnect } from "@/components/wallet/wallet-connect";
import { useGuardState } from "@/hooks/use-guard-state";

type TopbarProps = {
  title: string;
  subtitle: string;
};

export function Topbar({
  title,
  subtitle,
}: TopbarProps) {
  const {
    data,
    configured,
    loading,
  } = useGuardState();

  const guardLabel = !configured
    ? "Guard not configured"
    : loading && !data
      ? "Loading Guard"
      : data
        ? data.policy.frozen
          ? "Guard frozen"
          : "Guard active"
        : "Guard unavailable";

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur lg:flex">
      <div>
        <h1 className="text-[15px] font-semibold">
          {title}
        </h1>

        <p className="mt-0.5 text-xs text-muted">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-control bg-card px-3 py-1.5">
          <span className="size-2 rounded-full bg-cyan" />

          <span className="font-technical text-[10px]">
            NEAR Testnet
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-control bg-card px-3 py-1.5 text-muted">
          <ShieldCheck
            size={14}
            className={
              data?.policy.frozen
                ? "text-danger"
                : "text-cyan"
            }
          />

          <span className="text-xs">
            {guardLabel}
          </span>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-elevated hover:text-foreground"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
        </button>

        <WalletConnect />

        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
          <UserRound size={16} />
        </div>
      </div>
    </header>
  );
}
