"use client";

import { LogOut, WalletCards } from "lucide-react";

import { useWallet } from "@/context/wallet-context";

function shortenAccount(accountId: string) {
  if (accountId.length <= 28) {
    return accountId;
  }

  return `${accountId.slice(0, 14)}…${accountId.slice(-10)}`;
}

export function WalletConnect() {
  const {
    accountId,
    loading,
    signIn,
    signOut,
  } = useWallet();

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-muted">
        <WalletCards size={14} />
        <span className="font-technical text-[10px]">
          Wallet loading
        </span>
      </div>
    );
  }

  if (!accountId) {
    return (
      <button
        type="button"
        onClick={signIn}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 transition-colors hover:border-cyan/40 hover:bg-elevated"
      >
        <WalletCards size={14} className="text-cyan" />

        <span className="hidden text-[10px] uppercase tracking-wider text-muted xl:inline">
          Connected
        </span>

        <span className="font-technical text-[10px]">
          Connect wallet
        </span>
      </button>
    );
  }

  return (
    <div className="group flex items-center overflow-hidden rounded-full border border-border bg-card transition-colors hover:border-cyan/40 hover:bg-elevated">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <WalletCards size={14} className="text-cyan" />

        <span className="hidden text-[10px] uppercase tracking-wider text-muted xl:inline">
          Connected
        </span>

        <span
          className="font-technical text-[10px]"
          title={accountId}
        >
          {shortenAccount(accountId)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => void signOut()}
        aria-label="Disconnect wallet"
        className="flex self-stretch items-center border-l border-border px-2.5 text-muted transition-colors hover:bg-card hover:text-foreground"
      >
        <LogOut size={13} />
      </button>
    </div>
  );
}
