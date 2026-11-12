import { nearConfig } from "./near";

export function getTransactionExplorerUrl(
  transactionHash: string,
): string {
  const host =
    nearConfig.networkId === "testnet"
      ? "https://testnet.nearblocks.io"
      : "https://nearblocks.io";

  return `${host}/txns/${encodeURIComponent(transactionHash)}`;
}

export function shortenHash(
  transactionHash: string,
): string {
  if (transactionHash.length <= 18) {
    return transactionHash;
  }

  return `${transactionHash.slice(0, 9)}...${transactionHash.slice(-7)}`;
}
