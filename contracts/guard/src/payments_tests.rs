use crate::NocturneGuard;
use near_sdk::json_types::U128;
use near_sdk::test_utils::VMContextBuilder;
use near_sdk::{AccountId, NearToken, PromiseError, testing_env};

const ONE_NEAR: u128 = 1_000_000_000_000_000_000_000_000;

fn account(id: &str) -> AccountId {
    id.parse().unwrap()
}

fn context(caller: &str, day: u64) {
    let mut builder = VMContextBuilder::new();
    builder
        .current_account_id(account("guard.testnet"))
        .predecessor_account_id(account(caller))
        .account_balance(NearToken::from_yoctonear(100 * ONE_NEAR))
        .block_timestamp(day * 86_400_000_000_000);
    testing_env!(builder.build());
}

fn guard() -> NocturneGuard {
    context("owner.testnet", 0);
    let mut guard = NocturneGuard::new(account("owner.testnet"), account("agent.testnet"));
    guard.set_limits(U128(10 * ONE_NEAR), U128(8 * ONE_NEAR));
    guard.add_approved_recipient(account("merchant.testnet"));
    context("agent.testnet", 0);
    guard
}

fn id(value: u128) -> String {
    format!("req_{value:032x}")
}

fn request(guard: &mut NocturneGuard, number: u128, amount: u128) {
    let _promise = guard.request_payment(
        id(number),
        account("merchant.testnet"),
        U128(amount),
        format!("INV-{number}"),
    );
}

#[test]
fn first_payment_reserves_daily_allowance() {
    let mut guard = guard();
    request(&mut guard, 1, 8 * ONE_NEAR);

    let spending = guard.get_spending();

    assert_eq!(spending.daily_committed.0, 8 * ONE_NEAR);
    assert_eq!(spending.pending_total.0, 8 * ONE_NEAR);
    assert_eq!(spending.remaining_daily.0, 2 * ONE_NEAR);
    assert_eq!(spending.recorded_payments, 1);
    assert_eq!(guard.get_payment(id(1)).unwrap().status, "pending");
}

#[test]
#[should_panic(expected = "DailyLimitExceeded")]
fn concurrent_requests_cannot_exceed_daily_cap() {
    let mut guard = guard();
    request(&mut guard, 1, 8 * ONE_NEAR);
    request(&mut guard, 2, 8 * ONE_NEAR);
}

#[test]
#[should_panic(expected = "Unexpected request nonce")]
fn duplicate_request_id_is_rejected() {
    let mut guard = guard();
    request(&mut guard, 1, ONE_NEAR);
    request(&mut guard, 1, ONE_NEAR);
}

#[test]
#[should_panic(expected = "RecipientNotApproved")]
fn attacker_recipient_is_rejected() {
    let mut guard = guard();

    let _promise = guard.request_payment(
        id(1),
        account("attacker.testnet"),
        U128(ONE_NEAR),
        "INV-ATTACK".to_string(),
    );
}

#[test]
#[should_panic(expected = "Only the agent")]
fn owner_cannot_request_payment() {
    let mut guard = guard();
    context("owner.testnet", 0);
    request(&mut guard, 1, ONE_NEAR);
}

#[test]
#[should_panic(expected = "Only the contract can settle payments")]
fn external_account_cannot_settle() {
    let mut guard = guard();
    request(&mut guard, 1, ONE_NEAR);

    context("attacker.testnet", 0);
    guard.on_payment_complete(id(1), Ok(()));
}

#[test]
fn successful_callback_releases_pending_not_daily() {
    let mut guard = guard();
    request(&mut guard, 1, ONE_NEAR);

    context("guard.testnet", 0);
    assert!(guard.on_payment_complete(id(1), Ok(())));

    assert_eq!(guard.get_spending().pending_total.0, 0);
    assert_eq!(guard.get_spending().daily_committed.0, ONE_NEAR);
    assert_eq!(guard.get_payment(id(1)).unwrap().status, "confirmed");
}

#[test]
fn failed_callback_refunds_same_day_allowance() {
    let mut guard = guard();
    request(&mut guard, 1, ONE_NEAR);

    context("guard.testnet", 0);
    assert!(guard.on_payment_complete(id(1), Err(PromiseError::Failed)));

    assert_eq!(guard.get_spending().pending_total.0, 0);
    assert_eq!(guard.get_spending().daily_committed.0, 0);
    assert_eq!(guard.get_payment(id(1)).unwrap().status, "failed");
}

#[test]
fn old_day_failure_does_not_reduce_new_day_usage() {
    let mut guard = guard();
    request(&mut guard, 1, 3 * ONE_NEAR);

    context("agent.testnet", 1);
    request(&mut guard, 2, 2 * ONE_NEAR);

    context("guard.testnet", 1);
    assert!(guard.on_payment_complete(id(1), Err(PromiseError::Failed)));

    assert_eq!(guard.get_spending().daily_committed.0, 2 * ONE_NEAR);
    assert_eq!(guard.get_spending().pending_total.0, 2 * ONE_NEAR);
}

#[test]
fn duplicate_callback_has_no_effect() {
    let mut guard = guard();
    request(&mut guard, 1, ONE_NEAR);

    context("guard.testnet", 0);
    assert!(guard.on_payment_complete(id(1), Ok(())));
    assert!(!guard.on_payment_complete(id(1), Ok(())));

    assert_eq!(guard.get_spending().pending_total.0, 0);
    assert_eq!(guard.get_spending().daily_committed.0, ONE_NEAR);
}

#[test]
fn freeze_does_not_cancel_pending_transfer() {
    let mut guard = guard();
    request(&mut guard, 1, ONE_NEAR);

    context("owner.testnet", 0);
    guard.set_frozen(true);

    context("guard.testnet", 0);
    assert!(guard.on_payment_complete(id(1), Ok(())));

    assert_eq!(guard.get_payment(id(1)).unwrap().status, "confirmed");
}

#[test]
#[should_panic(expected = "Frozen")]
fn freeze_blocks_new_payment() {
    let mut guard = guard();

    context("owner.testnet", 0);
    guard.set_frozen(true);

    context("agent.testnet", 0);
    request(&mut guard, 1, ONE_NEAR);
}

#[test]
#[should_panic(expected = "Invalid request ID")]
fn malformed_request_id_rejected() {
    let mut guard = guard();
    let _promise = guard.request_payment(
        "same".to_string(),
        account("merchant.testnet"),
        U128(ONE_NEAR),
        "INV-1".to_string(),
    );
}

#[test]
#[should_panic(expected = "Invalid invoice reference")]
fn blank_invoice_reference_rejected() {
    let mut guard = guard();
    let _promise = guard.request_payment(
        id(1),
        account("merchant.testnet"),
        U128(ONE_NEAR),
        "".to_string(),
    );
}

#[test]
fn day_rollover_resets_daily_usage_not_pending_total() {
    let mut guard = guard();
    request(&mut guard, 1, 8 * ONE_NEAR);

    context("agent.testnet", 1);
    let spending = guard.get_spending();

    assert_eq!(spending.daily_committed.0, 0);
    assert_eq!(spending.pending_total.0, 8 * ONE_NEAR);

    request(&mut guard, 2, ONE_NEAR);

    assert_eq!(guard.get_spending().daily_committed.0, ONE_NEAR);
    assert_eq!(guard.get_spending().pending_total.0, 9 * ONE_NEAR);
}

#[test]
#[should_panic(expected = "Unexpected request nonce")]
fn settled_request_id_cannot_be_replayed() {
    let mut guard = guard();
    request(&mut guard, 1, ONE_NEAR);

    context("guard.testnet", 0);
    guard.on_payment_complete(id(1), Ok(()));

    context("agent.testnet", 0);
    request(&mut guard, 1, ONE_NEAR);
}
