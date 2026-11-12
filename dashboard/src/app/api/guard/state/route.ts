import { NextResponse } from "next/server";

import { guardAccount, guardViews } from "@/lib/near";
import { getRecentPayments } from "@/lib/payment-history";

export async function GET() {
  try {
    const [
      owner,
      agent,
      policy,
      spending,
      balance,
      payments,
    ] = await Promise.all([
      guardViews.getOwner(),
      guardViews.getAgent(),
      guardViews.getPolicy(),
      guardViews.getSpending(),
      guardAccount.getBalance(),
      getRecentPayments(),
    ]);

    return NextResponse.json({
      owner,
      agent,
      policy,
      spending,
      balanceYocto: balance.amount,
      payments,
    });
  } catch {
    return NextResponse.json(
      { error: "guard_state_unavailable" },
      { status: 500 },
    );
  }
}
