"use client";

import Link from "next/link";
import {
  Bot,
  CreditCard,
  Gavel,
  LayoutDashboard,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AppSection } from "@/components/layout/sidebar";

const navItems = [
  { id: "overview" as const, label: "Overview", href: "/", icon: LayoutDashboard },
  { id: "ai-agent" as const, label: "AI Agent", href: "/ai-agent", icon: Bot },
  { id: "payments" as const, label: "Payments", href: "/payments", icon: CreditCard },
  {
    id: "security-policies" as const,
    label: "Policies",
    href: "/security-policies",
    icon: Gavel,
  },
  { id: "settings" as const, label: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav({
  activeSection,
}: {
  activeSection: AppSection;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[68px] grid-cols-5 border-t border-border bg-card/98 px-1 backdrop-blur lg:hidden">
      {navItems.map(({ id, label, href, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          className={cn(
            "flex flex-col items-center justify-center gap-1",
            id === activeSection ? "text-primary" : "text-muted",
          )}
        >
          <Icon size={17} />
          <span className="text-[9px] font-semibold uppercase tracking-wide">
            {label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
