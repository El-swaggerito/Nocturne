"use client";

import Link from "next/link";
import {
  Bot,
  CreditCard,
  Gavel,
  LayoutDashboard,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type AppSection =
  | "overview"
  | "ai-agent"
  | "payments"
  | "security-policies"
  | "settings";

const navItems = [
  {
    id: "overview" as const,
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    id: "ai-agent" as const,
    label: "AI Agent",
    href: "/ai-agent",
    icon: Bot,
  },
  {
    id: "payments" as const,
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
  },
  {
    id: "security-policies" as const,
    label: "Security Policies",
    href: "/security-policies",
    icon: Gavel,
  },
  {
    id: "settings" as const,
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({
  activeSection,
}: {
  activeSection: AppSection;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex size-8 items-center justify-center rounded-control border border-primary/30 bg-elevated text-primary">
          <ShieldCheck size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">NOCTURNE</p>
          <p className="font-technical text-[9px] uppercase tracking-[0.18em] text-muted">
            NEAR Treasury Core
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 py-5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          Navigation
        </p>

        <nav className="mt-3 space-y-1">
          {navItems.map(({ id, label, href, icon: Icon }) => {
            const active = id === activeSection;

            return (
              <Link
                key={id}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-elevated font-medium text-primary"
                    : "text-muted hover:bg-elevated hover:text-foreground",
                )}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border bg-background p-4">
        <div className="rounded-control border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Freeze Status
            </span>

            <span className="font-technical text-[10px] text-cyan">
              UNFROZEN
            </span>
          </div>

          <p className="mt-2 text-[11px] leading-4 text-muted">
            New payment requests are accepted subject to policy.
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          <span className="font-technical text-[10px] text-faint">
            Demo UI
          </span>

          <span className="inline-flex items-center gap-1.5 font-technical text-[10px] text-cyan">
            <span className="size-1.5 rounded-full bg-cyan" />
            Testnet
          </span>
        </div>
      </div>
    </aside>
  );
}
