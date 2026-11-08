"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  PaymentView,
  PolicyView,
  SpendingView,
} from "@/lib/contract-types";
import {
  guardAccount,
  guardViews,
  hasConfiguredGuard,
  nearConfig,
} from "@/lib/near";
import { getRecentPayments } from "@/lib/payment-history";

export type GuardStateData = {
  owner: string;
  agent: string;
  policy: PolicyView;
  spending: SpendingView;
  balanceYocto: string;
  payments: PaymentView[];
};

type GuardState = {
  data: GuardStateData | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

async function loadGuardState(): Promise<GuardStateData> {
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

  if (
    typeof owner !== "string" ||
    typeof agent !== "string" ||
    !policy ||
    !spending
  ) {
    throw new Error("Guard returned an incomplete response");
  }

  return {
    owner,
    agent,
    policy,
    spending,
    balanceYocto: balance.amount,
    payments,
  };
}

function getErrorMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "Failed to load Guard state";
}

export function useGuardState(): GuardState {
  const [data, setData] = useState<GuardStateData | null>(null);
  const [loading, setLoading] = useState(hasConfiguredGuard);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hasConfiguredGuard) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextData = await loadGuardState();
      setData(nextData);
    } catch (cause) {
      console.error(
        `Failed to load Guard state from ${nearConfig.networkId}`,
        cause,
      );

      setData(null);
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasConfiguredGuard) {
      return;
    }

    let cancelled = false;

    loadGuardState()
      .then((nextData) => {
        if (cancelled) return;

        setData(nextData);
        setError(null);
      })
      .catch((cause) => {
        if (cancelled) return;

        console.error(
          `Failed to load Guard state from ${nearConfig.networkId}`,
          cause,
        );

        setData(null);
        setError(getErrorMessage(cause));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    data,
    loading,
    configured: hasConfiguredGuard,
    error,
    refresh,
  };
}
