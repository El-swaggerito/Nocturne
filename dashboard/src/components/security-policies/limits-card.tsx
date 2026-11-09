"use client";

import { useState } from "react";
import type { WalletSelector } from "@near-wallet-selector/core";
import { ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { setGuardLimits } from "@/lib/guard-actions";
import { parseNearToYoctoNear } from "@/lib/format-near";
import type { OwnerAccessState } from "@/lib/owner-access";
import { classifyWalletActionError } from "@/lib/wallet-errors";

type LimitsCardProps = {
  dailyLimit: string;
  transactionLimit: string;
  committedToday: string;
  remainingToday: string;
  ownerAccess: OwnerAccessState;
  selector: WalletSelector | null;
  accountId: string | null;
  refresh: () => Promise<void>;
};

type ActionState =
  | { status: "idle"; message: null }
  | { status: "confirming"; message: null }
  | { status: "pending"; message: string }
  | { status: "success"; message: string }
  | { status: "cancelled"; message: string }
  | { status: "error"; message: string };

function getErrorMessage(cause: unknown) {
  return cause instanceof Error
    ? cause.message
    : "The wallet transaction failed";
}

export function LimitsCard({
  dailyLimit,
  transactionLimit,
  committedToday,
  remainingToday,
  ownerAccess,
  selector,
  accountId,
  refresh,
}: LimitsCardProps) {
  const [dailyInput, setDailyInput] = useState("");
  const [transactionInput, setTransactionInput] = useState("");
  const [action, setAction] = useState<ActionState>({
    status: "idle",
    message: null,
  });

  const pending = action.status === "pending";

  const canMutate =
    ownerAccess === "owner" &&
    selector !== null &&
    accountId !== null &&
    !pending;

  function validateInputs() {
    const dailyYocto = parseNearToYoctoNear(dailyInput);
    const transactionYocto =
      parseNearToYoctoNear(transactionInput);

    if (BigInt(transactionYocto) > BigInt(dailyYocto)) {
      throw new Error(
        "Per-transaction limit cannot exceed the daily limit",
      );
    }

    return {
      dailyYocto,
      transactionYocto,
    };
  }

  function beginConfirmation() {
    if (!canMutate) {
      return;
    }

    try {
      validateInputs();

      setAction({
        status: "confirming",
        message: null,
      });
    } catch (cause) {
      setAction({
        status: "error",
        message: getErrorMessage(cause),
      });
    }
  }

  async function submit() {
    if (
      ownerAccess !== "owner" ||
      !selector ||
      !accountId ||
      pending
    ) {
      return;
    }

    let limits;

    try {
      limits = validateInputs();
    } catch (cause) {
      setAction({
        status: "error",
        message: getErrorMessage(cause),
      });
      return;
    }

    setAction({
      status: "pending",
      message: "Waiting for wallet approval to update spending limits.",
    });

    try {
      const result = await setGuardLimits(
        {
          selector,
          signerId: accountId,
        },
        limits.dailyYocto,
        limits.transactionYocto,
      );

      await refresh();

      setDailyInput("");
      setTransactionInput("");

      setAction({
        status: "success",
        message: result.transactionHash
          ? "Limit transaction completed. Transaction: " +
            result.transactionHash
          : "Wallet flow completed and Guard state was refreshed. No transaction hash was returned by the wallet.",
      });
    } catch (cause) {
      const failure = classifyWalletActionError(cause);

      setAction({
        status: failure.kind,
        message: failure.message,
      });
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">
              Spending Limits
            </h2>

            <span className="font-technical rounded bg-elevated px-2 py-0.5 text-[9px] uppercase text-primary">
              On-chain Policy
            </span>
          </div>

          <p className="mt-1 text-xs text-muted">
            Current limits enforced by the Nocturne Guard.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <LimitValue
          label="Daily Spending Limit"
          value={dailyLimit}
        />

        <LimitValue
          label="Per-Transaction Limit"
          value={transactionLimit}
        />

        <LimitValue
          label="Committed Today"
          value={committedToday}
        />

        <LimitValue
          label="Remaining Today"
          value={remainingToday}
        />
      </div>

      {ownerAccess === "owner" ? (
        <div className="mt-5 space-y-3 rounded-control border border-border bg-background p-4">
          <div>
            <p className="text-xs font-medium">
              Update spending limits
            </p>

            <p className="mt-1 text-[10px] leading-4 text-muted">
              Enter exact NEAR amounts. Values are converted to integer
              yoctoNEAR before the wallet transaction is created.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted">
                New daily limit
              </span>

              <input
                type="text"
                inputMode="decimal"
                value={dailyInput}
                disabled={pending}
                onChange={(event) =>
                  setDailyInput(event.target.value)
                }
                placeholder="100"
                className="h-10 w-full rounded-control border border-border bg-elevated px-3 font-technical text-xs outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted">
                New per-transaction limit
              </span>

              <input
                type="text"
                inputMode="decimal"
                value={transactionInput}
                disabled={pending}
                onChange={(event) =>
                  setTransactionInput(event.target.value)
                }
                placeholder="10"
                className="h-10 w-full rounded-control border border-border bg-elevated px-3 font-technical text-xs outline-none"
              />
            </label>
          </div>

          {action.status === "confirming" ? (
            <div className="rounded-control bg-elevated p-3">
              <p className="text-xs font-medium">
                Confirm new limits
              </p>

              <div className="mt-2 space-y-1 text-[10px] text-muted">
                <p>
                  Daily: {dailyInput} NEAR
                </p>
                <p>
                  Per transaction: {transactionInput} NEAR
                </p>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void submit()}
                  className="rounded-control bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                >
                  Continue to wallet
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAction({
                      status: "idle",
                      message: null,
                    })
                  }
                  className="rounded-control border border-border px-3 py-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={!canMutate}
              onClick={beginConfirmation}
              className="w-full rounded-control border border-border bg-elevated px-4 py-2.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending
                ? "Wallet request pending"
                : "Review limit update"}
            </button>
          )}

          {action.message ? (
            <p
              className={
                action.status === "error"
                  ? "text-[10px] leading-4 text-danger"
                  : "text-[10px] leading-4 text-muted"
              }
            >
              {action.message}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-[9px] text-muted">
          Connect the Guard owner account to update spending limits.
        </p>
      )}

      <div className="mt-5 rounded-control bg-elevated p-3">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck size={14} />

          <span className="text-[10px] font-semibold uppercase tracking-wider">
            Contract Enforcement
          </span>
        </div>

        <p className="mt-2 text-[10px] leading-4 text-muted">
          Payment requests must satisfy both the per-transaction limit and the
          remaining UTC daily allowance before transfer scheduling.
        </p>
      </div>
    </Card>
  );
}

function LimitValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-control bg-elevated p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </p>

      <p className="font-technical mt-2 text-lg">
        {value}{" "}
        <span className="text-[10px] text-muted">
          NEAR
        </span>
      </p>
    </div>
  );
}
