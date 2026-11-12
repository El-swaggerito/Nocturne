import { NextResponse } from "next/server";

import { guardAccount, guardViews } from "@/lib/near";
import { getRecentPayments } from "@/lib/payment-history";
import { getTransactionHashesByRequestId } from "@/lib/payment-journal-metadata";

export async function GET() {
  try {
    const [
      owner,
      agent,
      policy,
      spending,
      balance,
      payments,
      transactionHashes,
    ] = await Promise.all([
      guardViews.getOwner(),
      guardViews.getAgent(),
      guardViews.getPolicy(),
      guardViews.getSpending(),
      guardAccount.getBalance(),
      getRecentPayments(),
      getTransactionHashesByRequestId(),
    ]);

    return NextResponse.json({
      owner,
      agent,
      policy,
      spending,
      balanceYocto: balance.amount,
      payments: payments.map((payment) => {
        const transactionHash =
          transactionHashes.get(payment.request_id);

        return transactionHash
          ? { ...payment, transactionHash }
          : payment;
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "guard_state_unavailable" },
      { status: 500 },
    );
  }
}
