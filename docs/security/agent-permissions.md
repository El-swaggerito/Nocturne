# Agent access-key specification

Status: **specification for review** (Issue #4). Nothing here has been run on
testnet yet. Real evidence for every negative test in [§6](#6-negative-tests)
is collected under #14 and must not be claimed before then.

Related: [threat model](threat-model.md) T2, T6, T12, T18, I2. Agent client
code: `agent/src/near.ts` and `agent/src/config.ts` (#10).

---

## 1. Why the key matters, and what it doesn't protect

There are two independent layers between a compromised agent and the
treasury:

| Layer | Enforced by | What it stops |
|---|---|---|
| **Access-key permission** | NEAR protocol, before any contract code runs | The agent key signing anything except a zero-deposit call to `request_payment` on the Guard |
| **Contract checks** | Guard contract (`assert_owner`, `assert_agent`, policy from #5/#6) | Any account, including the agent account itself, doing anything the policy forbids |

The contract layer is authoritative. The key layer is defence in depth: if a
contract bug ever exposed an owner method to the agent account, the key would
still refuse to sign the call.

**The key allowance is not a spending limit.** It caps how much NEAR the key
can burn on **gas**. It has nothing to do with how much the Guard pays out.
Payment limits live only in the contract (#5, #6).

## 2. Accounts

| Account | Example (testnet) | Holds | Keys |
|---|---|---|---|
| **Guard contract** | `nocturne-guard.testnet` | The treasury | See threat model T11 (decision pending in #14) |
| **Owner** | `nocturne-owner.testnet` | Owner wallet | Owner's wallet only. **Never** on the agent server |
| **Agent** | `nocturne-agent.testnet` | Only enough NEAR for gas and storage (suggested: 1–2 NEAR on testnet) | One restricted function-call key on the agent server. One full-access key kept **offline** for key management only |

Rules:
- The agent account is a **dedicated** account. It must not be the owner,
  the Guard, a team member's personal account, or an allowlisted recipient.
- `NEAR_AGENT_ACCOUNT_ID` must equal the `agent_id` passed to the Guard's
  `new(owner_id, agent_id)`. The contract rejects `owner_id == agent_id`, and
  the agent config rejects `agent_id == NEAR_GUARD_ACCOUNT_ID`.
- The agent account's **full-access key never goes on the machine that runs
  the agent.** It's used only to add and delete keys (§4, §5), from a
  separate machine or hardware wallet held by the owner or the security lead.
- The agent account holds no treasury funds. If its balance is drained, only
  gas money is lost.

## 3. Restricted key parameters

| Field | Value | Reason |
|---|---|---|
| Permission type | `FunctionCall` | Never `FullAccess` |
| `receiver_id` | The Guard contract account, exactly | Key can't call any other contract (`ReceiverMismatch`) |
| `method_names` | `["request_payment"]`, exactly one entry | An **empty list means "all methods"** and must never be used (`MethodNameMismatch` for anything else) |
| `allowance` | **Finite.** Suggested `0.25 NEAR` for the testnet demo | A stolen key can only burn this much gas, then fails with `NotEnoughAllowance`. Never use unlimited |
| Attached deposit | Always `0` | NEAR protocol rejects any deposit on a function-call key (`DepositWithFunctionCall`). The agent client sends `deposit: 0n` |
| Prepaid gas per call | `100 Tgas` (current client value in `near.ts`) | Revisit once #6 fixes the callback gas it needs |
| Key type | `ed25519` | The agent config requires the `ed25519:` prefix |

**Sizing the allowance:** each call charges the prepaid gas at the current
gas price against the allowance. At the minimum testnet gas price (0.0001
NEAR per Tgas), a 100 Tgas call costs about 0.01 NEAR, so 0.25 NEAR is about
25 calls. Refunds for unused gas go to the account balance and, under the
current protocol, **don't top the allowance back up**, so the allowance works
as a hard call budget. Confirm this from the key's allowance before and after
a call in #14. When it
runs out, rotate (§4) rather than raising it to unlimited. Confirm the real
per-call cost from the first testnet transaction in #14 and adjust.

**What the agent client already checks** (`assertFunctionCallPermission`
in `agent/src/near.ts`): before any broadcast, it reads the key from chain
and refuses to send unless it's a `FunctionCall` key with
`receiver_id == NEAR_GUARD_ACCOUNT_ID` and `method_names == ["request_payment"]`.
It does **not** currently check that the allowance is finite. Recommended
follow-up for #10: also reject `allowance: null`.

## 4. Creating or rotating the key

Run from the machine holding the agent account's **full-access** key, never
the agent server. Commands use [near-cli-rs](https://github.com/near/near-cli-rs).
Flags change between versions, so if one is rejected, run `near` with no
arguments and pick the same options interactively.

1. **Generate the new key pair on the agent server**, so the private key
   never travels. Any ed25519 generator works. With the agent's own
   dependency:
   ```bash
   cd agent
   node -e 'const {KeyPair}=require("near-api-js");const k=KeyPair.fromRandom("ed25519");console.log("PUBLIC",k.getPublicKey().toString());console.log("SECRET",k.toString())'
   ```
   Put the `SECRET` line straight into the server's `.env` as
   `NEAR_AGENT_PRIVATE_KEY`. Copy **only** the `PUBLIC` value off the
   machine. Clear the terminal scrollback afterwards.
2. **Register the public key** on the agent account with the restricted
   permission:
   ```bash
   near account add-key nocturne-agent.testnet \
     grant-function-call-access \
       --allowance '0.25 NEAR' \
       --contract-account-id nocturne-guard.testnet \
       --function-names 'request_payment' \
     use-manually-provided-public-key ed25519:<PUBLIC> \
     network-config testnet sign-with-keychain send
   ```
3. **Verify on chain** before enabling writes:
   ```bash
   near account list-keys nocturne-agent.testnet network-config testnet now
   ```
   The new key must show `FunctionCall` with exactly the receiver, method and
   finite allowance from §3. Paste this output (public keys only) into the PR
   or #14 as evidence.
4. **When rotating:** delete the old key (§5, step 3) once the new key is
   verified, then restart the agent.

Only set `NEAR_ENABLE_TESTNET_WRITES=yes` after step 3 passes and the
security lead has signed off.

## 5. Revocation (suspected compromise)

Do these in order. Step 1 is the most urgent because it works even if you
can't reach the key-management machine.

1. **Owner freezes the Guard** (`set_frozen(true)` from the owner wallet).
   This stops all new payments immediately. It **can't cancel** a transfer
   already scheduled (threat model §7).
2. **Stop the agent process** and set `NEAR_ENABLE_TESTNET_WRITES=no`.
3. **Delete the compromised key** from the agent account:
   ```bash
   near account delete-keys nocturne-agent.testnet \
     public-keys ed25519:<COMPROMISED_PUBLIC> \
     network-config testnet sign-with-keychain send
   ```
4. **Verify** with `list-keys` that it's gone and that no unexpected keys
   were added. If any other key appears, treat the agent account's full-access
   key as compromised too (see below).
5. **Review what happened** using the agent's payment journal, the
   transaction history of the agent account in the explorer, and the Guard's
   audit trail (#6).
6. **Rotate** (§4), then the owner unfreezes.

**If the agent account's full-access key is compromised**, deleting one key
isn't enough: the attacker can add new keys. The Guard still limits them to
policy-compliant payments, because the contract checks `predecessor ==
agent_id`, not the key. Today the only response is **freeze and stay
frozen**, because the contract has **no method to replace `agent_id`**
(threat model T20; not added in #3). An owner-only `set_agent` that rejects
`new_agent == owner_id` is needed before mainnet. Raise it as a follow-up to
#3.

## 6. Negative tests

These are planned. #14 must attach real transaction hashes or RPC error
output for each row. The error names are NEAR's `InvalidAccessKeyError`
variants (rows 1–5) and the Guard's panic messages (rows 6–8).

| # | Attempt, signed with the restricted agent key | Expected result | Layer |
|---|---|---|---|
| 1 | Call `set_frozen` on the Guard | Transaction rejected: `MethodNameMismatch` | Key |
| 2 | Call `request_payment` on **another** contract | Transaction rejected: `ReceiverMismatch` | Key |
| 3 | Call `request_payment` with 1 yoctoNEAR attached | Transaction rejected: `DepositWithFunctionCall` | Key |
| 4 | Plain NEAR transfer, `AddKey`, `DeleteKey` or a multi-action transaction | Transaction rejected: `RequiresFullAccess` | Key |
| 5 | Keep calling until the allowance runs out | Transaction rejected: `NotEnoughAllowance` | Key |
| 6 | Owner method called by the agent account using its **full-access** key (simulates key-layer bypass) | Receipt fails: `Only the owner can perform this action` | Contract |
| 7 | `request_payment` signed by the owner or a third account | Receipt fails: `Only the agent can perform this action` (once #6 adds the method) | Contract |
| 8 | Future owner methods from #5 (limits, allowlist) called by the agent account | Receipt fails: `Only the owner can perform this action` | Contract |

Note the difference: rows 1–5 fail **before** the transaction executes (no
receipt, small or no gas cost). Rows 6–8 execute and fail inside the
contract, with a transaction hash and a `Failure` status. #14 should record
which kind of failure was observed.

## 7. Interface the key is scoped to

The key only permits `request_payment`, so the method name is fixed by this
spec. The arguments are what the agent client (#10) sends today. #6 must
confirm them or both sides must change together:

```json
{
  "request_id": "req_<32 lowercase hex>",
  "recipient_id": "merchant.testnet",
  "amount_yocto": "1500000000000000000000000",
  "invoice_reference": "INV-2026-0001"
}
```

- `amount_yocto` is a decimal **string** (`U128` in Rust), never a JSON number.
- `request_id` is derived from network, Guard account, agent account and
  invoice reference, so retries reuse the same ID. Consequence: two different
  invoices with the same reference can't both be paid. This fails closed and
  is accepted for the MVP.
- No other change methods will ever be added to the key. A new agent-callable
  method needs a new security review and a key rotation.

## 8. Storage and handling of the secret

- `NEAR_AGENT_PRIVATE_KEY` lives only in the agent server's `.env`, which is
  gitignored. Never in the repo, CI logs, screenshots, issues, the dashboard
  or the browser.
- The NEAR AI inference key (`NEAR_AI_KEY`) is a separate credential and
  doesn't grant any chain access.
- The owner key and the agent account's full-access key are **never** placed
  in any `.env` used by the agent. `loadNearPaymentConfig` only accepts one
  signing key and the client refuses to broadcast with a non-restricted one.
- Before each release (#16), scan history for `ed25519:` secrets.

## 9. Sign-off

- [ ] El-swaggerito: argument names in §7 match what #6 will implement.
- [ ] Lakes41: §3 matches the client. Consider the `allowance: null` check.
- [ ] Apexcomrade: key parameters and revocation steps approved.
- [ ] Evidence for every row in §6 attached in #14.
