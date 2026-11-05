# Nocturne threat model

Status: **draft for review** (Issue #2). The trust-boundary assumptions in
[§8](#8-assumptions-requiring-sign-off) need confirmation from the blockchain
engineer and the AI engineer before payment implementation (#6) starts.

This document describes the system as **designed**, not as built. The
"Status" column in each table says what exists today. At the time of writing,
only the owner/agent identities and the owner-only freeze from #1 are
implemented in `contracts/guard/src/lib.rs`.

---

## 1. System overview

Nocturne lets an AI agent pay supplier invoices out of a NEAR treasury. The
agent's job is to *propose* payments. The Guard contract on NEAR decides
whether a payment can go through.

```
 invoice (untrusted)
        │
        ▼
 ┌──────────────┐  proposal   ┌──────────────┐ request_payment ┌─────────────────┐ Promise::transfer ┌───────────┐
 │ NEAR AI model│ ──────────▶ │ Agent backend│ ──────────────▶ │  Guard contract │ ────────────────▶ │ Recipient │
 │  (untrusted) │  (untrusted)│ (FC key only)│ (restricted key)│ (authoritative) │                   └───────────┘
 └──────────────┘             └──────────────┘                 └─────────────────┘
                                                                  ▲  owner-only calls
                                    ┌──────────────┐  signed tx   │
                                    │  Dashboard   │ ─────────────┘
                                    │ (untrusted)  │   via owner wallet
                                    └──────────────┘
```

**Core security claim:** even a fully compromised agent (stolen key,
prompt-injected model, malicious backend) can only send NEAR to
**owner-approved recipients**, within the **per-payment and daily caps**,
while the Guard is **not frozen**. Everything outside the contract is
treated as untrusted input.

## 2. Principals

| Principal | Trust | Capabilities |
|---|---|---|
| **Owner** (`owner_id`) | Trusted. Ultimate authority | Sets limits and the allowlist, freezes/unfreezes, rotates the agent (#3). Signs with their own wallet. |
| **Agent** (`agent_id`) | **Untrusted / assumed compromisable** | Can call only `request_payment`, using a function-call access key (#4). |
| **Guard contract** | Trusted code (once reviewed and deployed) | Holds the treasury, enforces policy, settles transfers. |
| **Contract account key holder** | Owner-equivalent | Any full-access key on the Guard account can redeploy code or move funds directly. See T11. |
| **Recipients** | Untrusted | Receive plain NEAR transfers. They don't execute code during the transfer. |
| **Invoice author** | Untrusted / potentially hostile | Controls invoice content, including any embedded instructions. |
| **NEAR AI Cloud model** | Untrusted output | Turns invoice content into a proposal. It may be wrong or manipulated. |
| **Dashboard / browser** | Untrusted for authorisation | Shows state and builds transactions. The wallet and the contract do the actual authorisation. |
| **Third parties** | Untrusted | Anyone can call any public method on the contract. |

## 3. Assets

1. **Treasury balance**: NEAR held by the Guard account.
2. **Policy state**: owner, agent, allowlist, limits, frozen flag.
3. **Accounting state**: daily spent/reserved amounts, pending payments,
   processed request IDs, audit trail.
4. **Keys**: owner wallet key, agent function-call key, any full-access key on
   the Guard account, NEAR AI API key.
5. **Invoice data**: may contain supplier PII and commercial terms.

## 4. Attacker capabilities considered

- **A1 Compromised agent key.** The attacker can sign any transaction the
  agent's function-call key allows, as often as its gas allowance permits.
- **A2 Poisoned invoice / prompt injection.** The attacker controls invoice
  text and images, including instructions aimed at the model.
- **A3 Unauthorised caller.** Any NEAR account calling any public method with
  arbitrary arguments and attached deposits.
- **A4 Replay / repetition.** Re-sending an identical or modified
  `request_payment`, including during the asynchronous gap before a callback.
- **A5 Hostile recipient.** The recipient account doesn't exist, gets deleted,
  or is otherwise set up to make the transfer fail.
- **A6 Compromised frontend.** XSS, a malicious dependency or a phishing clone
  of the dashboard.
- **A7 Callback spoofing.** A third party calling the settlement callback
  directly.

**Out of scope** (accepted risks, see §7): compromise of the owner's key,
NEAR protocol or validator-level attacks, and bugs in `near-sdk` itself.

## 5. Threats

Enforcement boundary: **C** = Guard contract (authoritative), **K** = NEAR
access-key permissions, **A** = agent backend (defence in depth only),
**W** = owner's wallet, **O** = operational procedure.

| ID | Threat | Attacker | Impact | Enforcement boundary | Test | Status |
|---|---|---|---|---|---|---|
| T1 | Non-owner changes limits, allowlist or freeze | A1, A3 | Policy bypass, then full treasury drain | **C**: `predecessor == owner_id` on every mutation | `agent_cannot_freeze`, `stranger_cannot_freeze` (exist). Equivalents for limits/allowlist/rotation in #5, #3, #7 | Freeze ✅ / rest planned (#3, #5) |
| T2 | Non-agent calls `request_payment` | A3 | Unauthorised payments | **C**: `predecessor == agent_id` | Owner and stranger calls rejected (#3, #7) | Planned (#3, #6) |
| T3 | Agent pays an unapproved recipient (e.g. one an invoice redirected to) | A1, A2 | Funds stolen | **C**: allowlist check before the transfer is scheduled | Malicious-invoice demo, scenario 2 (#15). Unit test: recipient not on list (#5, #7) | Planned (#5) |
| T4 | Agent exceeds the per-payment cap | A1, A2 | Overspend | **C**: `amount <= per_tx_limit` | Boundary tests: equal to the limit passes, limit + 1 yocto fails (#5) | Planned (#5) |
| T5 | Agent exceeds the daily cap, including via several in-flight requests | A1, A4 | Overspend | **C**: amount is reserved *before* `Promise::transfer`, and the check is `spent + reserved + amount <= daily_limit` | Two 8 NEAR requests against a 10 NEAR cap: the second fails (#6, #7) | Planned (#6) |
| T6 | Duplicate request ID causes a double payment | A1, A4, agent retry bug | Double payment | **C**: request ID stored on first use and any repeat rejected. **A**: stable IDs across retries (#10) | Same ID twice → second rejected and no second promise (#6, #7). Retry test (#10) | Planned (#6, #10) |
| T7 | Payment while frozen | A1 | Payments continue during an incident | **C**: `request_payment` rejects when `frozen` | Demo scenario 4 (#15). Unit test (#5, #7) | Flag ✅ / check planned (#5) |
| T8 | Spoofed settlement callback marks a payment as failed and restores the allowance, or marks it as succeeded | A7, A3 | Accounting corruption, then cap bypass | **C**: callback is `#[private]` (`predecessor == current_account_id`). Each request settles at most once | Direct external call to the callback is rejected. A second settlement is a no-op or rejected (#6, #7) | Planned (#6) |
| T9 | Failed transfer leaves the reservation stuck, or restores budget to the wrong day | A5 | Budget locked (fails closed) or cap bypass (fails open) | **C**: callback releases the reservation, and only credits back the accounting day the request was reserved on | Transfer to a missing account in sandbox. Request on day D, failure settled on D+1 → D+1 budget unchanged (#6, #7) | Planned (#6) |
| T10 | Overflow/underflow in amount arithmetic | A1, A3 | Cap bypass or panic | **C**: `checked_*` arithmetic plus `overflow-checks = true` in release | Near-`u128::MAX` amounts and limits (#5, #7) | Release flag ✅ / rest planned |
| T11 | Full-access key on the Guard account redeploys code or transfers funds directly | Key holder, theft | Total bypass of all policy | **O**: delete full-access keys after deploy, or treat that key as owner-equivalent and record who holds it | Check of `view_access_key_list` on testnet (#14) | Open decision (§8) |
| T12 | Agent function-call key is broader than intended (wrong receiver, all methods, deposit) | A1 | Owner-only methods become reachable *if* the contract checks were also broken | **K**: receiver = Guard account, methods = `["request_payment"]`. FC keys can't attach a deposit. **C** still authoritative | Negative testnet calls with the agent key (#4, #14) | Planned (#4) |
| T13 | Payment drains the storage-staking reserve or gas buffer | A1 | Contract can't write state, so settlement fails | **C**: available = balance − locked storage cost − pending reservations − safety margin | Request equal to the full balance is rejected (#6, #7) | Planned (#6) |
| T14 | Audit trail / request-ID storage grows without limit | A1, A4 | Storage exhausts the balance, causing a DoS | **C**: bounded audit trail. Dedupe-storage policy (§8) | Many requests: storage stays bounded (#7) | Open decision (§8) |
| T15 | Prompt injection gets an approved recipient paid a wrong amount within the caps | A2 | Loss up to the per-payment and daily caps | **Not fully preventable on-chain.** Bounded by C (caps). **A** validates and shows proposals for review | Malicious fixture plus extractor output recorded honestly (#9) | Residual risk (§7) |
| T16 | Prompt injection changes owner, keys or policy | A2 | Policy takeover | **C/K**: the agent has no path to those methods. Invoice text is never used as system instructions (#8) | T1 tests and #9 fixture | Planned |
| T17 | Compromised dashboard tricks the owner into signing a harmful policy change | A6 | Allowlist or limits changed to the attacker's benefit | **W**: the owner reviews the transaction in their wallet. Dashboard never holds keys (#11, #13) | Manual review: dashboard bundle contains no keys (#11) | Residual risk (§7) |
| T18 | Secrets leaked via repo, logs or client bundle | — | Agent key or API key theft, leading to A1 | **O**: `.gitignore` for `.env*`/`*.key`/`*.pem`, no secrets in logs | Secret scan before release (#16) | `.gitignore` ✅ |
| T19 | Recipient re-entrancy | A5 | — | Plain `Transfer` actions run no recipient code. **Must be re-evaluated if token (`ft_transfer`) payments are added** | n/a for the NEAR-only MVP | N/A in MVP |
| T20 | Agent is rotated to the owner, or owner and agent end up the same account | Owner mistake | Agent gains owner rights | **C**: `owner_id != agent_id` at init and on rotation | `owner_and_agent_cannot_be_the_same` (exists). Rotation equivalent (#3) | Init ✅ / rotation planned (#3) |
| T21 | Payment to self (Guard account), owner or agent | A1 | Accounting confusion, or funds moved to a key the attacker may hold | **C**: reject `recipient == current_account_id` and `recipient == agent_id` even if listed | Unit tests (#5) | Planned (§8) |

## 6. Contract invariants

Each invariant must be true **after every receipt** that touches Guard state.
These are written so #7 can turn each one directly into tests.

| # | Invariant | Owner issue | Tested in |
|---|---|---|---|
| I1 | Only `owner_id` can change `frozen`, limits, the allowlist or `agent_id`. | #3, #5 | #7 |
| I2 | Only `agent_id` can call `request_payment`. The agent can call nothing else that changes state. | #3, #6 | #7 |
| I3 | `owner_id != agent_id` at all times. | #1 ✅, #3 | existing + #7 |
| I4 | A transfer is scheduled only if, **at scheduling time**: not frozen, recipient on the allowlist (and not self/agent), `0 < amount <= per_tx_limit`, `day_spent + day_reserved + amount <= daily_limit`, and `amount <= available_balance`. | #5, #6 | #7 |
| I5 | For the current UTC day: `day_spent + day_reserved <= daily_limit` (all values in yoctoNEAR, integer `u128`). | #6 | #7 |
| I6 | `available_balance = account_balance − storage_cost − Σ pending reservations − safety_margin`, computed without underflow. A request that would make it negative is rejected. | #6 | #7 |
| I7 | Every request ID moves forward only: `Pending → Succeeded` or `Pending → Failed`, and settles **exactly once**. A request ID that was already seen never schedules a second transfer. | #6 | #7 |
| I8 | The settlement callback runs only when `predecessor == current_account_id`. | #6 | #7 |
| I9 | On `Succeeded`: the reservation moves from reserved to spent for the **request's** accounting day. On `Failed`: the reservation is released for the **request's** day only. It never credits a different day. | #6 | #7 |
| I10 | Lowering a limit or removing a recipient never retroactively affects an already-scheduled transfer. It applies to the next request. | #5, #6 | #7 |
| I11 | Storage used by audit and dedupe data has a documented upper bound. | #6 | #7 |
| I12 | Amounts cross the JSON boundary as decimal strings (`U128`), never JS numbers. | #5, #6, #10 | #7, #10 |

## 7. Semantics and residual risks

### Freeze
- `set_frozen(true)` stops **new** `request_payment` calls from that block on.
- It **can't cancel** a transfer that was already scheduled. Once the
  `Promise::transfer` receipt exists, the transfer and its callback will
  execute. The callback still settles accounting while frozen.
- Freeze doesn't block owner policy changes, so the owner can fix things
  mid-incident.
- Freezing is the first response to suspected agent compromise. Revoking the
  agent's access key (#4) is the second.

### Failed transfers
- A transfer to a non-existent named account fails. The deposit comes back to
  the Guard as a refund receipt, which may arrive **after** the callback runs.
  Accounting must not assume the refund has landed when the callback executes.
- Implicit (64-hex) accounts are **created** by a transfer rather than
  failing. The allowlist is the only protection there.
- If the callback itself panics or runs out of gas, the request stays
  `Pending` and its reservation stays locked. This fails closed: the budget is
  lost for that day but no extra money moves. #6 must reserve enough
  callback gas. A recovery path (owner-only reconciliation) is an open
  question (§8).

### Day rollover
- Accounting day = `env::block_timestamp() / 86_400_000_000_000` (UTC days).
- Block timestamps are set by validators and can drift slightly. Requests
  near midnight may fall into either day. That's acceptable: the cap holds
  per day either way.
- A rollover resets `day_spent`/`day_reserved` for the new day. Pending
  reservations stay attached to the day they were made (I9).
- Up to `2 × daily_limit` can be sent in a short window across midnight. This
  is inherent to calendar-day caps and accepted.

### Storage and gas
- The Guard pays storage staking for allowlist, audit and dedupe entries.
  Payments must never touch the locked storage balance (I6).
- The agent's key allowance pays **gas only**. It isn't a spending limit.
  Treasury spending is limited solely by the contract.

### Accepted residual risks
- **R1 Owner key compromise** means full control of policy. Mitigation is
  outside the contract: hardware wallet or multisig owner.
- **R2 In-policy misuse (T15).** A manipulated agent can pay an approved
  recipient any amount up to the caps. Choose caps based on the loss you can
  tolerate in a day.
- **R3 Compromised dashboard (T17).** The owner must read wallet prompts.
- **R4 Invoice privacy.** Invoice content is sent to NEAR AI Cloud for
  inference. Don't use real private invoices in the demo.
- **R5 Already-scheduled transfers** can't be stopped by freeze.

## 8. Assumptions requiring sign-off

These must be confirmed by **El-swaggerito (contract)** and **Lakes41
(agent)** before #6 is implemented. Tick them in the PR review.

- [ ] **Owner is immutable** for the MVP (no owner-transfer method). Changes
      to this need a new review. (#3)
- [ ] **Agent rotation** is owner-only, rejects `new_agent == owner_id`, and
      doesn't change any other policy. **Not implemented in #3**: until it
      exists, a compromised agent account can only be handled by freezing
      (T20). (#3 follow-up)
- [ ] **Guard account full-access keys** (T11): either deleted after deploy,
      or the deployer key is treated as owner-equivalent and stored as such.
      Decide one. (#14)
- [ ] **Recipients equal to the Guard account or the agent** are rejected
      even if on the allowlist (T21). (#5)
- [ ] **Request ID format**: the agent (#10) sends `req_<32 lowercase hex>`,
      derived from network, Guard, agent and invoice reference, so it stays
      stable across retries. The contract should reject any other format. (#6)
- [ ] **Dedupe retention** (T14, I11): keep every seen request ID forever (a
      storage cost per payment), or keep a bounded window and require IDs to
      encode a date that the contract checks. Decide one.
- [ ] **Safety margin** amount for I6, in yoctoNEAR. (#6)
- [ ] **Stuck-pending recovery**: is an owner-only reconciliation method
      needed for callbacks that never settled, and how can it avoid being a
      cap-bypass primitive? (#6)
- [ ] **`request_payment` argument shape** agreed between Rust and
      TypeScript, as currently sent by the agent (#10): `{ request_id,
      recipient_id, amount_yocto: U128 string, invoice_reference }`. See
      [agent-permissions.md §7](agent-permissions.md#7-interface-the-key-is-scoped-to). (#6)
- [ ] **Invoice text is data only**: never concatenated into system prompts
      or used to pick methods, keys or recipients outside the allowlist.
      (#8, #9)
