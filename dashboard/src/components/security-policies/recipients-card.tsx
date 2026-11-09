"use client";

import { useState } from "react";
import type { WalletSelector } from "@near-wallet-selector/core";
import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  addGuardRecipient,
  removeGuardRecipient,
} from "@/lib/guard-actions";
import { isValidNearAccountId } from "@/lib/near-account";
import type { OwnerAccessState } from "@/lib/owner-access";
import { classifyWalletActionError } from "@/lib/wallet-errors";

type ActionState =
  | { status: "idle"; message: null }
  | {
      status: "confirming";
      message: null;
      kind: "add" | "remove";
      recipient: string;
    }
  | { status: "pending"; message: string }
  | { status: "success"; message: string }
  | { status: "cancelled"; message: string }
  | { status: "error"; message: string };


export function RecipientsCard({
  recipients,
  ownerAccess,
  selector,
  accountId,
  refresh,
}: {
  recipients: string[];
  ownerAccess: OwnerAccessState;
  selector: WalletSelector | null;
  accountId: string | null;
  refresh: () => Promise<void>;
}) {
  const [recipientInput, setRecipientInput] = useState("");
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

  function beginAdd() {
    if (!canMutate) {
      return;
    }

    const recipient = recipientInput.trim();

    if (!isValidNearAccountId(recipient)) {
      setAction({
        status: "error",
        message: "Enter a valid NEAR account ID",
      });
      return;
    }

    if (recipients.includes(recipient)) {
      setAction({
        status: "error",
        message: "Recipient is already approved",
      });
      return;
    }

    setAction({
      status: "confirming",
      message: null,
      kind: "add",
      recipient,
    });
  }

  function beginRemove(recipient: string) {
    if (!canMutate) {
      return;
    }

    setAction({
      status: "confirming",
      message: null,
      kind: "remove",
      recipient,
    });
  }

  async function submit() {
    if (
      action.status !== "confirming" ||
      ownerAccess !== "owner" ||
      !selector ||
      !accountId
    ) {
      return;
    }

    const { kind, recipient } = action;

    setAction({
      status: "pending",
      message:
        kind === "add"
          ? "Waiting for wallet approval to add recipient."
          : "Waiting for wallet approval to remove recipient.",
    });

    try {
      const context = {
        selector,
        signerId: accountId,
      };

      const result =
        kind === "add"
          ? await addGuardRecipient(context, recipient)
          : await removeGuardRecipient(context, recipient);

      await refresh();

      if (kind === "add") {
        setRecipientInput("");
      }

      setAction({
        status: "success",
        message: result.transactionHash
          ? (kind === "add"
              ? "Recipient transaction completed. Transaction: "
              : "Recipient removal completed. Transaction: ") +
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
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            Approved Recipients
          </h2>

          <Badge variant="cyan">
            {recipients.length} active
          </Badge>
        </div>

        <p className="mt-1 text-xs text-muted">
          Only approved NEAR accounts can receive Guard transfers.
        </p>
      </div>

      {ownerAccess === "owner" ? (
        <div className="mt-5 space-y-3">
          <div className="flex gap-2">
            <input
              value={recipientInput}
              disabled={pending}
              onChange={(event) =>
                setRecipientInput(event.target.value)
              }
              placeholder="recipient.testnet"
              className="font-technical h-10 min-w-0 flex-1 rounded-control border border-border bg-elevated px-3 text-xs outline-none"
            />

            <button
              type="button"
              disabled={!canMutate}
              onClick={beginAdd}
              className="flex items-center gap-2 rounded-control border border-border bg-elevated px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {recipients.length === 0 ? (
          <div className="rounded-control bg-elevated p-4 text-center">
            <p className="text-xs font-medium">
              No approved recipients
            </p>

            <p className="mt-1 text-[10px] text-muted">
              The Guard currently has an empty recipient allowlist.
            </p>
          </div>
        ) : (
          recipients.map((recipient) => (
            <div
              key={recipient}
              className="flex items-center justify-between gap-3 rounded-control bg-elevated p-3"
            >
              <span
                className="font-technical min-w-0 truncate text-[10px] font-medium"
                title={recipient}
              >
                {recipient}
              </span>

              {ownerAccess === "owner" ? (
                <button
                  type="button"
                  disabled={!canMutate}
                  onClick={() => beginRemove(recipient)}
                  aria-label={`Remove ${recipient}`}
                  className="flex size-8 items-center justify-center rounded-control border border-border text-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              ) : (
                <Badge variant="success">
                  Approved
                </Badge>
              )}
            </div>
          ))
        )}
      </div>

      {action.status === "confirming" ? (
        <div className="mt-4 rounded-control border border-border bg-background p-3">
          <p className="text-xs font-medium">
            Confirm recipient change
          </p>

          <p className="mt-1 text-[10px] leading-4 text-muted">
            {action.kind === "add"
              ? `Add ${action.recipient} to the approved recipient list.`
              : `Remove ${action.recipient} from the approved recipient list.`}
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
      ) : null}

      {action.message ? (
        <p
          className={
            action.status === "error"
              ? "mt-4 text-[10px] leading-4 text-danger"
              : "mt-4 text-[10px] leading-4 text-muted"
          }
        >
          {action.message}
        </p>
      ) : null}

      {ownerAccess !== "owner" ? (
        <p className="mt-4 rounded-control bg-background p-3 text-[10px] leading-4 text-muted">
          Connect the Guard owner account to manage approved recipients.
        </p>
      ) : null}
    </Card>
  );
}
