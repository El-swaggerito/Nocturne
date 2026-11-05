# Guard contract security review (Issue #7)

| | |
|---|---|
| **Scope** | `contracts/guard` at `main` commit `586211d` (after #3, #5, #6) |
| **Reviewer** | Apexcomrade (security lead) |
| **Method** | Code review against [threat model](threat-model.md) §5–§6, adversarial unit tests, and sandbox integration tests on a local NEAR node (`near-sandbox` 2.14.0, `near-workspaces` 0.24.0) |
| **Not covered** | Testnet behaviour, access-key enforcement, Guard account keys. Those need real evidence in #14 |

## Summary

The core security claim holds on a real NEAR node. A caller other than the
owner can't change policy. Only the agent can request payments. Payments to
recipients that aren't approved, payments over the per-payment or daily cap,
duplicate request IDs, payments while frozen, attached deposits and
externally-called settlement callbacks are all rejected. A failed transfer is
marked `failed` and its allowance released.

The review found **one medium issue that should be fixed before any real
use (F1)**, one known medium design gap (F4), and three low or informational
items.

| ID | Severity | Finding | Status |
|---|---|---|---|
| F1 | **Medium** | A compromised agent can permanently stop all payments for 256 yoctoNEAR | Open. Failing test included |
| F2 | Low | In-flight payments are counted twice against the treasury balance | Open. Failing test included |
| F3 | Low | The Guard itself or the agent can be added as an approved recipient | Open. Failing test included |
| F4 | Medium (known, T20) | No owner method to replace the agent account | Open |
| F5 | Info | Payment history is stored inline in contract state | Open |

## How to run

```bash
cargo test -p nocturne_guard                       # 52 unit tests
cargo test -p nocturne_integration_tests           # 16 sandbox tests
# Tests that demonstrate open findings (these FAIL until fixed):
cargo test -p nocturne_guard -- --ignored
cargo test -p nocturne_integration_tests -- --ignored
```
Sandbox setup: [`integration-tests/README.md`](../../integration-tests/README.md).

**Observed results** at `586211d` plus this PR's tests:
- `nocturne_guard`: 52 passed, 0 failed, 2 ignored (F1, F3).
- `nocturne_integration_tests`: 16 passed, 0 failed, 1 ignored (F2).
- Run with `--ignored`, F1, F2 and F3 each fail as described below.
- `cargo fmt --all --check` is clean.

## Findings

### F1 (Medium): payment history cap lets the agent stop all payments permanently

`request_payment` refuses new requests once `payments.len() >= MAX_PAYMENTS`
(256), and records are never removed. That makes 256 a **lifetime** limit on
payments, not a limit on records kept.

- **Attack:** a compromised agent sends 256 payments of 1 yoctoNEAR each to
  any approved recipient. Every request is within policy: cost 256 yoctoNEAR
  plus gas. After that, every request fails with
  `Payment history capacity reached`.
- **Impact:** no funds are lost, but the Guard can never pay again. Freezing,
  changing limits or changing recipients doesn't help, and there's no
  recovery method. The only way out is redeploying code from the Guard
  account. Even without an attacker, normal use runs out after 256 payments.
- **Evidence:** `security_tests::finding_f1_settled_history_does_not_brick_guard`
  fails at `lib.rs:181` with `Payment history capacity reached`.
- **Recommended fix** (needs a decision on dedupe retention, threat model §8):
  - Let settled (`confirmed`/`failed`) records be pruned. Either an owner-only
    `prune_settled(before_utc_day)`, or automatic pruning of records older
    than N days.
  - Keep duplicate protection for pruned IDs. Either keep a compact set of
    seen IDs, or have the contract reject requests whose ID belongs to a day
    that's already been pruned. That needs a day-scoped request ID, which is
    an agent change (#10).
  - Optionally add a minimum payment amount, so tiny dust payments can't
    burn through history.

### F2 (Low): in-flight payments are counted twice against the balance

The balance check is
`pending_total + amount + storage_reserve <= env::account_balance()`.
NEAR deducts a transfer's amount from the account balance when the transfer
receipt is created, so `account_balance()` already excludes in-flight
payments. Adding `pending_total` counts them a second time.

- **Impact:** while a payment is in flight (a few blocks), the agent can
  spend only about half of what's actually free. Affordable payments fail
  with `Insufficient unreserved treasury balance`. This fails closed: no
  overspend, only rejected payments.
- **Evidence:** the Guard is funded with exactly reserve + 2 × 3 NEAR + 1 NEAR.
  - `control_f2_treasury_covers_two_sequential_payments` passes: the two
    payments succeed one after the other.
  - `finding_f2_affordable_concurrent_payments_are_both_accepted` fails: when
    the two run at the same time, the second is rejected at `lib.rs:207`.
- **Recommended fix:** use `amount + storage_reserve <= env::account_balance()`.
  Keep `pending_total` for accounting and the dashboard. A failed transfer's
  refund lands later, which only makes the check more conservative in the
  meantime.

### F3 (Low): the Guard or the agent can be approved as a recipient

`add_approved_recipient` accepts `env::current_account_id()` and `agent_id`
(threat model T21).

- **Impact:** needs an owner mistake. Paying the agent sends treasury funds
  to the account most likely to be compromised. Paying the Guard itself
  creates a no-op transfer that still uses allowance.
- **Evidence:** `security_tests::finding_f3_self_and_agent_cannot_be_approved`
  fails.
- **Recommended fix:** reject both in `add_approved_recipient`. Consider
  rejecting `owner_id` too, if owner payouts aren't a use case.

### F4 (Medium, known): no agent rotation

The agent is fixed at initialisation. If the agent account's full-access
key is compromised (not just its restricted key), the only response is to
freeze permanently. See [agent-permissions.md §5](agent-permissions.md#5-revocation-suspected-compromise).
**Recommended fix:** owner-only `set_agent(new_agent)` that rejects
`new_agent == owner_id` and `new_agent == current_account_id`, logs the
change, and leaves all other policy unchanged.

### F5 (Info): payment history is stored inline

`payments: BTreeMap<..>` lives in the root contract state. Every call
deserialises and reserialises the whole history, so gas grows with it. This
is acceptable at 256 records. **If F1 is fixed by allowing more records,
switch to `near_sdk::store::LookupMap`/`IterableMap`.**

## Coverage against threat-model invariants

U = unit test (`contracts/guard/src/*_tests.rs`), S = sandbox test
(`integration-tests/tests/guard.rs`).

| Invariant | Covered by |
|---|---|
| I1 owner-only mutations | U `policy_tests::agent_cannot_*`, `stranger_cannot_add_recipient`. S `non_owner_policy_mutations_are_rejected_on_chain` |
| I2 agent-only payments | U `owner_cannot_request_payment`. S `only_agent_can_request_payment` |
| I3 owner ≠ agent | U `owner_and_agent_cannot_be_the_same`. S `stranger_cannot_initialise_guard` |
| I4 checks before scheduling | U `policy_tests` boundaries. S `redirected_recipient_is_rejected_and_unpaid`, `per_payment_cap_is_exact`, `freeze_blocks_new_payments_and_unfreeze_restores`, `attached_deposit_is_rejected`, `payments_rejected_before_owner_sets_limits` (U) |
| I5 daily cap incl. in-flight | U `concurrent_requests_cannot_exceed_daily_cap`. S `concurrent_requests_cannot_both_reserve_against_daily_cap`, `daily_cap_holds_across_sequential_payments` |
| I6 balance and storage reserve | S `payment_cannot_spend_storage_reserve`, `control_f2_*`. **F2** |
| I7 settle exactly once, no replay | U `duplicate_callback_has_no_effect`, `settled_request_id_cannot_be_replayed`, `uppercase_hex_request_id_is_rejected`. S `duplicate_request_id_never_pays_twice` |
| I8 private callback | U `external_account_cannot_settle`. S `settlement_callback_cannot_be_called_externally` |
| I9 per-day release on failure | U `failed_callback_refunds_same_day_allowance`, `old_day_failure_does_not_reduce_new_day_usage`. S `failed_transfer_is_marked_failed_and_allowance_restored` |
| I10 policy changes aren't retroactive | U `freeze_does_not_cancel_pending_transfer`, `lowering_limits_applies_to_already_committed_spend`, `removing_recipient_blocks_future_payments_only` |
| I11 bounded storage | U `recipient_cap_is_enforced`. **F1** (bounded, but by permanently refusing payments) |
| I12 amounts as strings | S `amount_as_json_number_is_rejected` |

## Untested risks

- **Settlement step running out of gas.** It has a fixed 25 Tgas. If it
  ever fails, the payment stays `pending` and its allowance stays locked:
  fails closed, but there's no recovery method. Not forced in tests.
- **Day rollover on a real chain.** Covered by unit tests with mocked
  timestamps only. The sandbox wasn't fast-forwarded a full day.
- **Access-key layer** (agent-permissions.md §6 rows 1–5) and **Guard account
  full-access keys** (T11): testnet only, in #14.
- **Implicit (64-hex) recipients:** a transfer creates the account instead of
  failing. Only the allowlist protects here. Not tested.
- **Ignored findings:** the tests for F1–F3 must be un-ignored as part of each
  fix.

## Recommendation for #14

- **F2 and F3** are small changes. Fix them in one PR, re-run both suites and
  un-ignore their tests.
- **F1 and F4** need a design decision on dedupe retention and agent
  rotation. They don't block a testnet demo with fewer than 256 payments, but
  they **must be resolved before any real funds are used**.
