import type { ReactNode } from "react";
import { Bell, ShieldCheck, UserRound } from "lucide-react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar, type AppSection } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

type AppShellProps = {
  children: ReactNode;
  activeSection: AppSection;
  title: string;
  subtitle: string;
};

export function AppShell({
  children,
  activeSection,
  title,
  subtitle,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} />

      <div className="lg:pl-[248px]">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-control bg-elevated text-primary">
              <ShieldCheck size={17} />
            </div>

            <div>
              <p className="text-xs font-semibold">NOCTURNE</p>
              <p className="font-technical text-[8px] uppercase tracking-widest text-muted">
                NEAR Treasury
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Notifications"
              className="flex size-8 items-center justify-center rounded-control text-muted"
            >
              <Bell size={16} />
            </button>

            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
              <UserRound size={15} />
            </div>
          </div>
        </div>

        <Topbar title={title} subtitle={subtitle} />

        <main className="pb-24 lg:pb-0">
          {children}
        </main>
      </div>

      <MobileNav activeSection={activeSection} />
    </div>
  );
}
