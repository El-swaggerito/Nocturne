"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  setupWalletSelector,
  type WalletSelector,
} from "@near-wallet-selector/core";
import { setupModal, type WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";

import { nearConfig } from "@/lib/near";

type WalletContextValue = {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accountId: string | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;

    async function initialise() {
      const nextSelector = await setupWalletSelector({
        network: nearConfig.networkId,
        modules: [setupMeteorWallet()],
      });

      const nextModal = setupModal(nextSelector, {
        contractId: nearConfig.contractId || undefined,
      });

      if (!active) {
        return;
      }

      setSelector(nextSelector);
      setModal(nextModal);

      const syncAccount = () => {
        const account = nextSelector
          .store
          .getState()
          .accounts.find((candidate) => candidate.active);

        setAccountId(account?.accountId ?? null);
      };

      syncAccount();

      subscription = nextSelector.store.observable.subscribe(() => {
        syncAccount();
      });

      setLoading(false);
    }

    initialise().catch((error) => {
      console.error("Failed to initialise NEAR wallet selector", error);

      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      selector,
      modal,
      accountId,
      loading,
      signIn: () => {
        modal?.show();
      },
      signOut: async () => {
        if (!selector) {
          return;
        }

        const wallet = await selector.wallet();
        await wallet.signOut();
      },
    }),
    [selector, modal, accountId, loading],
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }

  return context;
}
