"use client";

import { KeyRound, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type LimitsCardProps = {
  dailyLimit: string;
  transactionLimit: string;
  onDailyLimitChange: (value: string) => void;
  onTransactionLimitChange: (value: string) => void;
  onReview: () => void;
};

export function LimitsCard({
  dailyLimit,
  transactionLimit,
  onDailyLimitChange,
  onTransactionLimitChange,
  onReview,
}: LimitsCardProps) {
  const daily = Number(dailyLimit);
  const transaction = Number(transactionLimit);

  const valid =
    Number.isFinite(daily) &&
    Number.isFinite(transaction) &&
    daily > 0 &&
    transaction > 0 &&
    transaction <= daily;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Spending Limits</h2>

            <span className="font-technical rounded bg-elevated px-2 py-0.5 text-[9px] uppercase text-primary">
              Policy Engine
            </span>
          </div>

          <p className="mt-1 text-xs text-muted">
            Edit the daily and per-transaction limits enforced by the Guard.
          </p>
        </div>

        <span className="font-technical rounded bg-elevated px-2 py-1 text-[9px] text-cyan">
          Demo State
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <LimitInput
          label="Daily Spending Limit"
          helper="Resets by UTC accounting day"
          value={dailyLimit}
          onChange={onDailyLimitChange}
        />

        <LimitInput
          label="Per-Transaction Limit"
          helper="Must not exceed daily limit"
          value={transactionLimit}
          onChange={onTransactionLimitChange}
        />
      </div>

      <div className="mt-5 rounded-control bg-elevated p-3">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            Validation Rules
          </span>
        </div>

        <p className="mt-2 text-[10px] leading-4 text-muted">
          Both limits must be greater than zero. Per-transaction limit cannot
          exceed the daily limit. Contract amounts are ultimately submitted as
          integer yoctoNEAR values.
        </p>

        {!valid && (
          <p className="mt-2 text-[10px] font-medium text-danger">
            Current values are not valid.
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-5 gap-1 rounded-control bg-background p-2 text-center">
        {["Edit", "Review", "Wallet", "Execute", "State"].map(
          (label, index) => (
            <div key={label} className="min-w-0">
              <span
                className={
                  index === 0
                    ? "font-technical mx-auto flex size-5 items-center justify-center rounded-full bg-primary text-[9px] text-white"
                    : "font-technical mx-auto flex size-5 items-center justify-center rounded-full bg-elevated text-[9px] text-muted"
                }
              >
                {index + 1}
              </span>

              <p className="mt-1 truncate text-[8px] uppercase tracking-wider text-muted">
                {label}
              </p>
            </div>
          ),
        )}
      </div>

      <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Button
          disabled={!valid}
          onClick={onReview}
          className="sm:min-w-[170px]"
        >
          <KeyRound size={14} />
          Review Limit Update
        </Button>

        <p className="font-technical text-[9px] text-muted">
          Demo only · owner signature required later
        </p>
      </div>
    </Card>
  );
}

function LimitInput({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold">{label}</label>
        <span className="font-technical text-[9px] text-muted">
          {helper}
        </span>
      </div>

      <div className="relative mt-2">
        <input
          value={value}
          inputMode="decimal"
          onChange={(event) => onChange(event.target.value)}
          className="font-technical h-12 w-full rounded-control border border-border bg-elevated px-3 pr-16 text-lg outline-none transition-colors focus:border-primary"
        />

        <span className="font-technical absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">
          NEAR
        </span>
      </div>
    </div>
  );
}
