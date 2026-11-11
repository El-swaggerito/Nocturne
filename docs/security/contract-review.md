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

The original review found one medium implementation issue (F1), one known medium design gap (F4), and three low or informational items. F1, F2 and F3 have since been remediated and retained as regression tests. F4 remains an explicit design gap outside the hackathon MVP.

| ID | Severity | Finding | Status |
|---|---|---|---|
| F1 | **Medium** | A compromised agent can permanently stop all payments for 256 yoctoNEAR | **Fixed**. Settled records are pruned while sequential nonces prevent replay |
| F2 | Low | In-flight payments are counted twice against the treasury balance | **Fixed**. Balance check no longer double-counts `pending_total` |
| F3 | Low | The Guard itself or the agent can be added as an approved recipient | **Fixed**. Both recipients are rejected |
| F4 | Medium (known, T20) | No owner method to replace the agent account | Open |
| F5 | Info | Payment history is stored inline in contract state | Open |

## How to run

```bash
cargo test -p nocturne_guard                       # 56 unit tests
cargo test -p nocturne_integration_tests           # sandbox security tests
```
Sandbox setup: [`integration-tests/README.md`](../../integration-tests/README.md).

**Current verification status:**
- `nocturne_guard`: 56 passed, 0 failed, 0 ignored on the current Issue #7 branch.
- `cargo fmt --all --check` is clean.
- Sandbox coverage remains implemented in `integration-tests/tests/guard.rs`. It must be executed on a supported `near-workspaces` platform; local `darwin-x86_64` cannot run near-workspaces 0.24.0.

## Findings

### F1 (Medium, fixed): payment history cap could stop all payments permanently

**Original finding:** the initial implementation refused new requests once
`payments.len() >= MAX_PAYMENTS` (256), while settled records were never
removed. This made 256 a lifetime payment limit.

- **Attack:** a compromised agent sends 256 payments of 1 yoctoNEAR each to
  any approved recipient. Every request is within policy: cost 256 yoctoNEAR
  plus gas. After that, every request fails with
  `Payment history capacity reached`.
- **Original impact:** no funds were lost, but the Guard could stop accepting
  payments permanently after 256 settled records. Freezing or changing policy
  could not recover it, so normal use or a compromised agent could exhaust the
  payment-history capacity.
- **Remediation:** when the history reaches capacity, the Guard prunes a
  settled record before recording the next request.
- **Replay protection:** request IDs use a strictly increasing on-chain nonce,
  so a pruned request ID cannot be submitted again.
- **Regression evidence:** `finding_f1_settled_history_does_not_brick_guard`
  and `finding_f1_pruned_request_id_cannot_be_replayed` both pass in the
  current unit suite.

### F2 (Low, fixed): in-flight payments were counted twice against the balance

**Original finding:** the balance check included
`pending_total + amount + storage_reserve`, even though the account balance
already reflected funds committed to in-flight transfers. This could reject
otherwise affordable concurrent payments.

- **Impact:** while a payment is in flight (a few blocks), the agent can
  spend only about half of what's actually free. Affordable payments fail
  with `Insufficient unreserved treasury balance`. This fails closed: no
  overspend, only rejected payments.
- **Remediation:** the contract now checks
  `amount + storage_reserve <= env::account_balance()` and keeps
  `pending_total` only for payment accounting and reporting.
- **Regression evidence:** the unit regression
  `finding_f2_pending_total_is_not_double_counted_against_balance` passes.
  The corresponding sandbox regression is active and must run on a supported
  `near-workspaces` platform.

### F3 (Low, fixed): the Guard or the agent could be approved as a recipient

**Original finding:** `add_approved_recipient` allowed the Guard account or
the configured agent account to be added as recipients (threat model T21).

- **Impact:** needs an owner mistake. Paying the agent sends treasury funds
  to the account most likely to be compromised. Paying the Guard itself
  creates a no-op transfer that still uses allowance.
- **Remediation:** `add_approved_recipient` now rejects both the Guard account
  and the configured agent account.
- **Regression evidence:** `finding_f3_self_and_agent_cannot_be_approved`
  passes in the current unit suite.

### F4 (Medium, known): no agent rotation

The agent is fixed at initialisation. If the agent account's full-access
key is compromised (not just its restricted key), the only response is to
freeze permanently. See [agent-permissions.md §5](agent-permissions.md#5-revocation-suspected-compromise).
**Recommended fix:** owner-only `set_agent(new_agent)` that rejects
`new_agent == owner_id` and `new_agent == current_account_id`, logs the
change, and leaves all other policy unchanged.

### F5 (Info): payment history is stored inline

`payments: BTreeMap<..>` lives in the root contract state. Every call
deserialises and reserialises the whole history, so gas grows with it. This remains acceptable for the bounded MVP history, but gas cost grows with
the inline map. If the retained history size is increased substantially,
consider `near_sdk::store::LookupMap` or `IterableMap`.

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
| I6 balance and storage reserve | U `finding_f2_pending_total_is_not_double_counted_against_balance`. S `payment_cannot_spend_storage_reserve`, `control_f2_*`, `finding_f2_affordable_concurrent_payments_are_both_accepted` |
| I7 settle exactly once, no replay | U `duplicate_callback_has_no_effect`, `settled_request_id_cannot_be_replayed`, `uppercase_hex_request_id_is_rejected`. S `duplicate_request_id_never_pays_twice` |
| I8 private callback | U `external_account_cannot_settle`. S `settlement_callback_cannot_be_called_externally` |
| I9 per-day release on failure | U `failed_callback_refunds_same_day_allowance`, `old_day_failure_does_not_reduce_new_day_usage`. S `failed_transfer_is_marked_failed_and_allowance_restored` |
| I10 policy changes aren't retroactive | U `freeze_does_not_cancel_pending_transfer`, `lowering_limits_applies_to_already_committed_spend`, `removing_recipient_blocks_future_payments_only` |
| I11 bounded storage | U `recipient_cap_is_enforced`, `finding_f1_settled_history_does_not_brick_guard`, `finding_f1_pruned_request_id_cannot_be_replayed` |
| I12 amounts as strings | S `amount_as_json_number_is_rejected` |

## Untested risks

- **Settlement step running out of gas.** It has a fixed 25 Tgas. If it
  ever fails, the payment stays `pending` and its allowance stays locked:
  fails closed, but there's no recovery method. Not forced in tests.
- **Day rollover on a real chain.** Covered by unit tests with mocked
  timestamps only. The sandbox wasn't fast-forwarded a full day.
- **Guard account full-access keys** (T11): operational account-key security is
  outside the contract test suite.
- **Restricted agent access key:** verified separately on NEAR testnet in #14;
  this review does not treat testnet key evidence as sandbox coverage.
- **Implicit (64-hex) recipients:** a transfer creates the account instead of
  failing. Only the allowlist protects here. Not tested.
- F1, F2 and F3 now have active regression coverage. The F2 sandbox regression test is no longer ignored.

## Follow-up status

- F1, F2 and F3 were remediated before the live testnet demo.
- Restricted agent-key behaviour was verified on NEAR testnet in #14.
- F4, owner-controlled agent rotation, remains a documented design gap outside the hackathon MVP.
- The contract remains hackathon software and is not audited for mainnet funds.
