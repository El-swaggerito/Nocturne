import type { Metadata } from "next";
import type { ReactNode } from "react";

import { WalletProvider } from "@/context/wallet-context";
import { inter, jetBrainsMono } from "@/lib/fonts";

import "@near-wallet-selector/modal-ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nocturne",
    template: "%s | Nocturne",
  },
  description:
    "Secure, policy-enforced treasury controls for autonomous AI agents on NEAR.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
