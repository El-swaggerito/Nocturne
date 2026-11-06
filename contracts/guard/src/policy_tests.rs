use crate::NocturneGuard;
use crate::policy::{MILLIS_PER_DAY, PolicyError, check_payment, utc_day};
use near_sdk::json_types::U128;
use near_sdk::test_utils::VMContextBuilder;
use near_sdk::{AccountId, testing_env};

fn account(id: &str) -> AccountId {
    id.parse().unwrap()
}

fn caller(id: &str) {
    let mut ctx = VMContextBuilder::new();
    ctx.predecessor_account_id(account(id));
    testing_env!(ctx.build());
}

fn guard() -> NocturneGuard {
    caller("owner.testnet");
    NocturneGuard::new(account("owner.testnet"), account("agent.testnet"))
}

fn configured() -> NocturneGuard {
    let mut g = guard();
    g.set_limits(U128(100), U128(40));
    g.add_approved_recipient(account("merchant.testnet"));
    g
}

#[test]
fn owner_can_configure_limits_and_recipients() {
    let mut g = configured();
    let view = g.get_policy();

    assert_eq!(view.daily_limit.0, 100);
    assert_eq!(view.per_transaction_limit.0, 40);
    assert_eq!(view.approved_recipients.len(), 1);
    assert!(g.is_recipient_approved(account("merchant.testnet")));

    assert!(g.remove_approved_recipient(account("merchant.testnet")));
    assert!(!g.is_recipient_approved(account("merchant.testnet")));
}

#[test]
fn duplicate_recipient_is_not_added_twice() {
    let mut g = configured();
    assert!(!g.add_approved_recipient(account("merchant.testnet")));
    assert_eq!(g.get_policy().approved_recipients.len(), 1);
}

#[test]
#[should_panic(expected = "Only the owner")]
fn agent_cannot_change_limits() {
    let mut g = configured();
    caller("agent.testnet");
    g.set_limits(U128(200), U128(100));
}

#[test]
#[should_panic(expected = "Only the owner")]
fn stranger_cannot_add_recipient() {
    let mut g = configured();
    caller("attacker.testnet");
    g.add_approved_recipient(account("attacker.testnet"));
}

#[test]
#[should_panic(expected = "Only the owner")]
fn agent_cannot_remove_recipient() {
    let mut g = configured();
    caller("agent.testnet");
    g.remove_approved_recipient(account("merchant.testnet"));
}

#[test]
#[should_panic(expected = "Only the owner")]
fn agent_cannot_unfreeze() {
    let mut g = configured();
    g.set_frozen(true);
    caller("agent.testnet");
    g.set_frozen(false);
}

#[test]
#[should_panic(expected = "Daily limit must be positive")]
fn zero_daily_limit_is_rejected() {
    guard().set_limits(U128(0), U128(0));
}

#[test]
#[should_panic(expected = "Transaction limit must be positive")]
fn zero_transaction_limit_is_rejected() {
    guard().set_limits(U128(100), U128(0));
}

#[test]
#[should_panic(expected = "Transaction limit exceeds daily limit")]
fn inconsistent_limits_are_rejected() {
    guard().set_limits(U128(10), U128(11));
}

#[test]
fn exact_transaction_limit_is_allowed() {
    let g = configured();
    assert_eq!(
        g.validate_proposal(&account("merchant.testnet"), 40, 0),
        Ok(())
    );
}

#[test]
fn one_above_transaction_limit_is_rejected() {
    let g = configured();
    assert_eq!(
        g.validate_proposal(&account("merchant.testnet"), 41, 0),
        Err(PolicyError::TransactionLimitExceeded)
    );
}

#[test]
fn exact_daily_limit_is_allowed() {
    let g = configured();
    assert_eq!(
        g.validate_proposal(&account("merchant.testnet"), 40, 60),
        Ok(())
    );
}

#[test]
fn one_above_daily_limit_is_rejected() {
    let g = configured();
    assert_eq!(
        g.validate_proposal(&account("merchant.testnet"), 40, 61),
        Err(PolicyError::DailyLimitExceeded)
    );
}

#[test]
fn unapproved_recipient_is_rejected() {
    let g = configured();
    assert_eq!(
        g.validate_proposal(&account("attacker.testnet"), 10, 0),
        Err(PolicyError::RecipientNotApproved)
    );
}

#[test]
fn zero_payment_is_rejected() {
    let g = configured();
    assert_eq!(
        g.validate_proposal(&account("merchant.testnet"), 0, 0),
        Err(PolicyError::ZeroAmount)
    );
}

#[test]
fn frozen_guard_rejects_payments() {
    let mut g = configured();
    g.set_frozen(true);

    assert_eq!(
        g.validate_proposal(&account("merchant.testnet"), 10, 0),
        Err(PolicyError::Frozen)
    );
}

#[test]
fn checked_arithmetic_rejects_overflow() {
    assert_eq!(
        check_payment(false, true, 2, u128::MAX, 2, u128::MAX),
        Err(PolicyError::ArithmeticOverflow)
    );
}

#[test]
fn utc_day_rollover_is_exact() {
    assert_eq!(utc_day(0), 0);
    assert_eq!(utc_day(MILLIS_PER_DAY - 1), 0);
    assert_eq!(utc_day(MILLIS_PER_DAY), 1);
    assert_eq!(utc_day(MILLIS_PER_DAY * 2), 2);
}

#[test]
fn read_only_policy_reflects_freeze_state() {
    let mut g = configured();
    g.set_frozen(true);
    assert!(g.get_policy().frozen);
}

#[test]
fn all_sixty_four_recipients_are_supported() {
    let mut g = guard();

    for i in 0..64 {
        let recipient = account(&format!("merchant{i}.testnet"));
        assert!(g.add_approved_recipient(recipient));
    }

    assert_eq!(g.get_policy().approved_recipients.len(), 64);
}

#[test]
#[should_panic(expected = "Recipient limit reached")]
fn recipient_cap_is_enforced() {
    let mut g = guard();

    for i in 0..65 {
        g.add_approved_recipient(account(&format!("merchant{i}.testnet")));
    }
}
