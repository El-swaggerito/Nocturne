export const settingsDemoData = {
  network: {
    name: "NEAR Testnet",
    rpcHost: "rpc.testnet.near.org",
    explorerHost: "testnet.nearblocks.io",
  },

  owner: {
    accountId: "owner.nocturne.testnet",
    role: "Treasury Owner",
  },

  contract: {
    accountId: "nocturne-guard.testnet",
    version: "Not reported",
    frozen: false,
    ownerMethods: [
      "set_limits",
      "add_approved_recipient",
      "remove_approved_recipient",
      "set_frozen",
    ],
    agentMethods: ["request_payment"],
    viewMethods: [
      "get_policy",
      "get_payment",
      "get_spending",
    ],
  },

  agent: {
    accountId: "agent-v1.nocturne.testnet",
    keyType: "Restricted function-call key",
    target: "nocturne-guard.testnet",
    allowedMethod: "request_payment",
    allowance: "Finite function-call gas allowance",
  },

  ai: {
    provider: "NEAR AI Cloud",
    status: "Demo / Offline",
    extraction: "Structured invoice parsing",
    authority: "None",
  },

  security: [
    "Contract spending policy",
    "Recipient allowlist",
    "UTC daily spending limit",
    "Per-transaction limit",
    "Emergency Freeze",
    "Restricted agent access",
  ],
};
