import "server-only";

import {
  NearPaymentClient,
  createNearTestnetTransport,
  loadNearPaymentConfig,
} from "@nocturne/agent";

export function createServerPaymentClient() {
  const config = loadNearPaymentConfig();
  return new NearPaymentClient(config, createNearTestnetTransport());
}
