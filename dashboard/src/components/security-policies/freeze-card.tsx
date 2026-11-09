"use client";

import { useState } from "react";
import type { WalletSelector } from "@near-wallet-selector/core";
import { LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { setGuardFrozen } from "@/lib/guard-actions";
import type { OwnerAccessState } from "@/lib/owner-access";
import { classifyWalletActionError } from "@/lib/wallet-errors";

type ActionState =
  | { status: "idle"; message: null }
  | { status: "confirming"; message: null }
  | { status: "pending"; message: string }
  | { status: "success"; message: string }
  | { status: "cancelled"; message: string }
  | { status: "error"; message: string };


export function FreezeCard({
  frozen,
  ownerAccess,
  selector,
  accountId,
  refresh,
}: {
  frozen: boolean;
  ownerAccess: OwnerAccessState;
  selector: WalletSelector | null;
  accountId: string | null;
  refresh: () => Promise<void>;
}) {
  const [action, setAction] = useState<ActionState>({
    status: "idle",
    message: null,
  });

  const nextFrozen = !frozen;
  const pending = action.status === "pending";
  const canMutate =
    ownerAccess === "owner" &&
    selector !== null &&
    accountId !== null &&
    !pending;

  async function submit() {
    if (
      ownerAccess !== "owner" ||
      !selector ||
      !accountId ||
      pending
    ) {
      return;
    }

    setAction({
      status: "pending",
      message: nextFrozen
        ? "Waiting for wallet approval to freeze the Guard."
        : "Waiting for wallet approval to unfreeze the Guard.",
    });

    try {
      const result = await setGuardFrozen(
        {
          selector,
          signerId: accountId,
        },
        nextFrozen,
      );

      await refresh();

      setAction({
        status: "success",
        message: result.transactionHash
          ? (nextFrozen
              ? "Freeze transaction completed. Transaction: "
              : "Unfreeze transaction completed. Transaction: ") +
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
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-control bg-danger-bg text-danger">
              <LockKeyhole size={16} />
            </div>

            <h2 className="text-lg font-semibold">
              Emergency Freeze
            </h2>
          </div>

          <p className="mt-1 text-xs text-muted">
            Owner-only contract control for new payment requests.
          </p>
        </div>

        <Badge variant={frozen ? "danger" : "success"}>
          {frozen ? "Frozen" : "Unfrozen"}
        </Badge>
      </div>

      <div className="mt-5 space-y-2 rounded-control bg-background p-4">
        <p className="text-xs font-medium leading-5">
          {frozen
            ? "New payment requests are currently blocked."
            : "New payment requests may be evaluated against policy."}
        </p>

        <p className="text-[10px] leading-4 text-muted">
          Freezing does not cancel transfers already scheduled before the
          freeze, revoke the agent function-call key, or reverse confirmed
          payments.
        </p>
      </div>

      {ownerAccess === "owner" ? (
        <div className="mt-4 space-y-3">
          {action.status === "confirming" ? (
            <div className="rounded-control border border-border bg-elevated p-3">
              <p className="text-xs font-medium">
                Confirm {nextFrozen ? "freeze" : "unfreeze"}
              </p>

              <p className="mt-1 text-[10px] leading-4 text-muted">
                Your wallet will request approval for an owner-signed
                set_frozen transaction.
              </p>

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
              onClick={() =>
                setAction({
                  status: "confirming",
                  message: null,
                })
              }
              className="w-full rounded-control border border-border bg-elevated px-4 py-2.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending
                ? "Wallet request pending"
                : nextFrozen
                  ? "Freeze Guard"
                  : "Unfreeze Guard"}
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
          Connect the Guard owner account to access freeze controls.
        </p>
      )}
    </Card>
  );
}
