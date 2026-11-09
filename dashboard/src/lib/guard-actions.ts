import {
  actionCreators,
  type FinalExecutionOutcome,
  type WalletSelector,
} from "@near-wallet-selector/core";

import { requireContractId } from "@/lib/near";

const OWNER_ACTION_GAS = BigInt("30000000000000");
const ZERO_DEPOSIT = BigInt(0);

export type GuardActionResult = {
  outcome: FinalExecutionOutcome | null;
  transactionHash: string | null;
};

function getTransactionHash(
  outcome: FinalExecutionOutcome | void,
): string | null {
  if (!outcome) {
    return null;
  }

  const transaction = outcome.transaction as unknown;

  if (
    typeof transaction !== "object" ||
    transaction === null
  ) {
    return null;
  }

  const hash = (transaction as {
    hash?: unknown;
  }).hash;

  return typeof hash === "string" && hash.length > 0
    ? hash
    : null;
}

function getExecutionFailure(
  outcome: FinalExecutionOutcome | void,
): string | null {
  if (!outcome) {
    return null;
  }

  const status = outcome.status;

  if (status === "Failure") {
    return "NEAR transaction execution failed";
  }

  if (
    typeof status === "object" &&
    status !== null &&
    "Failure" in status
  ) {
    const failure = status.Failure;

    if (
      typeof failure === "object" &&
      failure !== null &&
      "error_message" in failure &&
      typeof failure.error_message === "string"
    ) {
      return failure.error_message;
    }

    return "NEAR transaction execution failed";
  }

  return null;
}

type GuardActionContext = {
  selector: WalletSelector;
  signerId: string;
};

async function callGuard(
  { selector, signerId }: GuardActionContext,
  methodName: string,
  args: Record<string, unknown>,
) {
  if (!signerId) {
    throw new Error("A connected wallet account is required");
  }

  const wallet = await selector.wallet();
  const contractId = requireContractId();

  const outcome = await wallet.signAndSendTransaction({
    signerId,
    receiverId: contractId,
    actions: [
      actionCreators.functionCall(
        methodName,
        args,
        OWNER_ACTION_GAS,
        ZERO_DEPOSIT,
      ),
    ],
  });

  const failure = getExecutionFailure(outcome);

  if (failure) {
    throw new Error(failure);
  }

  return {
    outcome: outcome ?? null,
    transactionHash: getTransactionHash(outcome),
  } satisfies GuardActionResult;
}

export function setGuardLimits(
  context: GuardActionContext,
  dailyLimitYocto: string,
  perTransactionLimitYocto: string,
) {
  return callGuard(
    context,
    "set_limits",
    {
      daily_limit: dailyLimitYocto,
      per_transaction_limit: perTransactionLimitYocto,
    },
  );
}

export function addGuardRecipient(
  context: GuardActionContext,
  recipient: string,
) {
  return callGuard(
    context,
    "add_approved_recipient",
    {
      recipient,
    },
  );
}

export function removeGuardRecipient(
  context: GuardActionContext,
  recipient: string,
) {
  return callGuard(
    context,
    "remove_approved_recipient",
    {
      recipient,
    },
  );
}

export function setGuardFrozen(
  context: GuardActionContext,
  frozen: boolean,
) {
  return callGuard(
    context,
    "set_frozen",
    {
      frozen,
    },
  );
}
