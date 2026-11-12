"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  PaymentView,
  PolicyView,
  SpendingView,
} from "@/lib/contract-types";
import {
  hasConfiguredGuard,
  nearConfig,
} from "@/lib/near";

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
  const response = await fetch("/api/guard/state", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load Guard state");
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("owner" in data) ||
    !("agent" in data) ||
    !("policy" in data) ||
    !("spending" in data) ||
    !("balanceYocto" in data) ||
    !("payments" in data)
  ) {
    throw new Error("Guard returned an incomplete response");
  }

  return data as GuardStateData;
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
