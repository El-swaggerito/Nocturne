import { describe, expect, it } from "vitest";

import { getOwnerAccessState } from "./owner-access";

describe("getOwnerAccessState", () => {
  it("returns guard-unavailable when Guard state is unavailable", () => {
    expect(
      getOwnerAccessState({
        accountId: "owner.testnet",
        ownerId: null,
        guardAvailable: false,
      }),
    ).toBe("guard-unavailable");
  });

  it("returns disconnected when no wallet is connected", () => {
    expect(
      getOwnerAccessState({
        accountId: null,
        ownerId: "owner.testnet",
        guardAvailable: true,
      }),
    ).toBe("disconnected");
  });

  it("returns owner for the configured owner account", () => {
    expect(
      getOwnerAccessState({
        accountId: "owner.testnet",
        ownerId: "owner.testnet",
        guardAvailable: true,
      }),
    ).toBe("owner");
  });

  it("returns non-owner for any other connected account", () => {
    expect(
      getOwnerAccessState({
        accountId: "attacker.testnet",
        ownerId: "owner.testnet",
        guardAvailable: true,
      }),
    ).toBe("non-owner");
  });
});
