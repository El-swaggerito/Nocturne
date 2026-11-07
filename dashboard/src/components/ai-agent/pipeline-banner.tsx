import { KeyRound, ShieldCheck } from "lucide-react";

export function PipelineBanner() {
  return (
    <section className="relative overflow-hidden rounded-card border border-border bg-card p-4 sm:p-5">
      <div className="absolute -right-16 -top-16 size-56 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-control bg-elevated text-cyan">
            <ShieldCheck size={18} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan">
                Core Security Invariant
              </span>

              <span className="font-technical text-[9px] text-faint">
                UNTRUSTED INPUT BOUNDARY
              </span>
            </div>

            <p className="mt-1 max-w-4xl text-xs leading-5 text-muted">
              Invoice content is untrusted. AI may extract a proposal, but only
              contract policy determines whether a submitted payment request is
              accepted.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="font-technical inline-flex items-center gap-2 rounded-control bg-elevated px-3 py-1.5 text-[10px] text-cyan">
            <span className="size-1.5 rounded-full bg-cyan" />
            Demonstration Mode
          </span>

          <span className="font-technical inline-flex items-center gap-2 rounded-control bg-elevated px-3 py-1.5 text-[10px]">
            <KeyRound size={13} className="text-primary" />
            request_payment only
          </span>
        </div>
      </div>
    </section>
  );
}
