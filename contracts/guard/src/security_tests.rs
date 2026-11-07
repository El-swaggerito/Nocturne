//! Adversarial unit tests from the Issue #7 security review.
//! Ignored tests assert the behaviour we WANT and currently fail; see
//! docs/security/contract-review.md. Run them with `-- --ignored`.
use crate::NocturneGuard;
use near_sdk::json_types::U128;
use near_sdk::test_utils::VMContextBuilder;
use near_sdk::{AccountId, NearToken, testing_env};

const ONE_NEAR: u128 = 1_000_000_000_000_000_000_000_000;

fn account(id: &str) -> AccountId {
    id.parse().unwrap()
}

fn context(caller: &str) {
    context_with_balance(caller, 100 * ONE_NEAR);
}

fn context_with_balance(caller: &str, balance: u128) {
    let mut builder = VMContextBuilder::new();
    builder
        .current_account_id(account("guard.testnet"))
        .predecessor_account_id(account(caller))
        .account_balance(NearToken::from_yoctonear(balance));
    testing_env!(builder.build());
}

fn guard() -> NocturneGuard {
    context("owner.testnet");
    let mut guard = NocturneGuard::new(account("owner.testnet"), account("agent.testnet"));
    guard.set_limits(U128(10 * ONE_NEAR), U128(8 * ONE_NEAR));
    guard.add_approved_recipient(account("merchant.testnet"));
    guard
}

fn pay_and_settle(guard: &mut NocturneGuard, n: u128, amount: u128) {
    context("agent.testnet");
    let id = format!("req_{n:032x}");
    let _ = guard.request_payment(
        id.clone(),
        account("merchant.testnet"),
        U128(amount),
        format!("INV-{n}"),
    );
    context("guard.testnet");
    assert!(guard.on_payment_complete(id, Ok(())));
}

#[test]
fn finding_f1_settled_history_does_not_brick_guard() {
    // A compromised agent sends 256 one-yoctoNEAR payments to an approved
    // recipient: total cost 256 yoctoNEAR, well inside every limit.
    let mut guard = guard();
    for n in 1..=256 {
        pay_and_settle(&mut guard, n, 1);
    }
    // A legitimate payment must still be possible afterwards.
    pay_and_settle(&mut guard, 257, ONE_NEAR);
}

#[test]
fn finding_f1_pruned_request_id_cannot_be_replayed() {
    let mut guard = guard();

    for n in 1..=256 {
        pay_and_settle(&mut guard, n, 1);
    }

    pay_and_settle(&mut guard, 257, ONE_NEAR);

    assert!(
        guard.get_payment(format!("req_{:032x}", 1)).is_none(),
        "oldest settled payment should have been pruned"
    );

    assert_eq!(guard.get_next_request_id(), format!("req_{:032x}", 258));

    context("agent.testnet");
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let _ = guard.request_payment(
            format!("req_{:032x}", 1),
            account("merchant.testnet"),
            U128(1),
            "INV-REPLAY".to_string(),
        );
    }));

    assert!(
        result.is_err(),
        "pruned request ID must remain non-replayable"
    );
}

#[test]
fn finding_f3_self_and_agent_cannot_be_approved() {
    let mut guard = guard();
    assert!(!guard.add_approved_recipient(account("guard.testnet")));
    assert!(!guard.add_approved_recipient(account("agent.testnet")));
}

#[test]
fn finding_f2_pending_total_is_not_double_counted_against_balance() {
    let mut guard = guard();

    context("agent.testnet");
    let _ = guard.request_payment(
        format!("req_{:032x}", 1),
        account("merchant.testnet"),
        U128(4 * ONE_NEAR),
        "INV-1".to_string(),
    );

    assert_eq!(guard.get_spending().pending_total.0, 4 * ONE_NEAR);

    let storage_reserve = u128::from(near_sdk::env::storage_usage())
        .checked_mul(near_sdk::env::storage_byte_cost().as_yoctonear())
        .and_then(|n| n.checked_add(ONE_NEAR))
        .expect("storage reserve calculation overflow");

    let second_payment = ONE_NEAR;

    context_with_balance("agent.testnet", storage_reserve + second_payment);

    let _ = guard.request_payment(
        format!("req_{:032x}", 2),
        account("merchant.testnet"),
        U128(second_payment),
        "INV-2".to_string(),
    );

    assert_eq!(guard.get_spending().pending_total.0, 5 * ONE_NEAR);
}

#[test]
fn lowering_limits_applies_to_already_committed_spend() {
    // I10: an owner reacting to an incident by lowering the cap must
    // immediately block further spending, counting what is already committed.
    let mut guard = guard();
    pay_and_settle(&mut guard, 1, 5 * ONE_NEAR);
    context("owner.testnet");
    guard.set_limits(U128(5 * ONE_NEAR), U128(5 * ONE_NEAR));
    context("agent.testnet");
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let _ = guard.request_payment(
            format!("req_{:032x}", 2),
            account("merchant.testnet"),
            U128(1),
            "INV-2".to_string(),
        );
    }));
    assert!(
        result.is_err(),
        "1 yoctoNEAR above the lowered cap must be rejected"
    );
}

#[test]
fn removing_recipient_blocks_future_payments_only() {
    let mut guard = guard();
    pay_and_settle(&mut guard, 1, ONE_NEAR);
    context("owner.testnet");
    assert!(guard.remove_approved_recipient(account("merchant.testnet")));
    assert_eq!(
        guard.get_payment(format!("req_{:032x}", 1)).unwrap().status,
        "confirmed"
    );
    context("agent.testnet");
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let _ = guard.request_payment(
            format!("req_{:032x}", 2),
            account("merchant.testnet"),
            U128(ONE_NEAR),
            "INV-2".to_string(),
        );
    }));
    assert!(result.is_err());
}

#[test]
#[should_panic(expected = "Invalid request ID")]
fn uppercase_hex_request_id_is_rejected() {
    // The agent emits lowercase hex only; a second spelling of the same ID
    // would defeat duplicate detection.
    let mut guard = guard();
    context("agent.testnet");
    let _ = guard.request_payment(
        format!("req_{}", "A".repeat(32)),
        account("merchant.testnet"),
        U128(ONE_NEAR),
        "INV-1".to_string(),
    );
}

#[test]
#[should_panic(expected = "Invalid invoice reference")]
fn oversized_invoice_reference_is_rejected() {
    let mut guard = guard();
    context("agent.testnet");
    let _ = guard.request_payment(
        format!("req_{:032x}", 1),
        account("merchant.testnet"),
        U128(ONE_NEAR),
        "X".repeat(129),
    );
}

#[test]
#[should_panic(expected = "TransactionLimitExceeded")]
fn payments_rejected_before_owner_sets_limits() {
    // Fresh Guard: limits default to zero, so nothing can be paid (fail closed).
    context("owner.testnet");
    let mut guard = NocturneGuard::new(account("owner.testnet"), account("agent.testnet"));
    guard.add_approved_recipient(account("merchant.testnet"));
    context("agent.testnet");
    let _ = guard.request_payment(
        format!("req_{:032x}", 1),
        account("merchant.testnet"),
        U128(1),
        "INV-1".to_string(),
    );
}
