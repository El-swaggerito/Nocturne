mod payments;
#[cfg(test)]
mod payments_tests;
mod policy;
#[cfg(test)]
mod policy_tests;
#[cfg(test)]
mod security_tests;

use near_sdk::json_types::U128;
use near_sdk::{AccountId, PanicOnDefault, env, near};
use near_sdk::{Gas, NearToken, Promise, PromiseError};
use payments::{
    CALLBACK_GAS_TGAS, MAX_PAYMENTS, PaymentRecord, PaymentStatus, PaymentView,
    SAFETY_RESERVE_YOCTO, SpendingView,
};
use policy::{MAX_RECIPIENTS, PolicyError, check_payment, utc_day};
use std::collections::BTreeMap;

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct NocturneGuard {
    owner_id: AccountId,
    agent_id: AccountId,
    frozen: bool,
    daily_limit: u128,
    per_transaction_limit: u128,
    approved_recipients: Vec<AccountId>,
    payments: BTreeMap<String, PaymentRecord>,
    pending_total: u128,
    daily_day: u64,
    daily_committed: u128,
}

#[near(serializers = [json])]
pub struct PolicyView {
    pub frozen: bool,
    pub daily_limit: U128,
    pub per_transaction_limit: U128,
    pub approved_recipients: Vec<AccountId>,
    pub current_utc_day: u64,
}

#[near]
impl NocturneGuard {
    #[init]
    pub fn new(owner_id: AccountId, agent_id: AccountId) -> Self {
        assert_eq!(
            env::predecessor_account_id(),
            owner_id,
            "Only the designated owner can initialise"
        );

        assert_ne!(owner_id, agent_id, "Owner and agent must be different");

        Self {
            owner_id,
            agent_id,
            frozen: false,
            daily_limit: 0,
            per_transaction_limit: 0,
            approved_recipients: Vec::new(),
            payments: BTreeMap::new(),
            pending_total: 0,
            daily_day: utc_day(env::block_timestamp_ms()),
            daily_committed: 0,
        }
    }

    pub fn get_owner(&self) -> AccountId {
        self.owner_id.clone()
    }

    pub fn get_agent(&self) -> AccountId {
        self.agent_id.clone()
    }

    pub fn is_frozen(&self) -> bool {
        self.frozen
    }

    pub fn set_limits(&mut self, daily_limit: U128, per_transaction_limit: U128) {
        self.assert_owner();

        assert!(daily_limit.0 > 0, "Daily limit must be positive");
        assert!(
            per_transaction_limit.0 > 0,
            "Transaction limit must be positive"
        );
        assert!(
            per_transaction_limit.0 <= daily_limit.0,
            "Transaction limit exceeds daily limit"
        );

        self.daily_limit = daily_limit.0;
        self.per_transaction_limit = per_transaction_limit.0;
    }

    pub fn add_approved_recipient(&mut self, recipient: AccountId) -> bool {
        self.assert_owner();

        if recipient == env::current_account_id() || recipient == self.agent_id {
            return false;
        }

        if self.approved_recipients.contains(&recipient) {
            return false;
        }

        assert!(
            self.approved_recipients.len() < MAX_RECIPIENTS,
            "Recipient limit reached"
        );
        self.approved_recipients.push(recipient);
        true
    }

    pub fn remove_approved_recipient(&mut self, recipient: AccountId) -> bool {
        self.assert_owner();

        if let Some(index) = self
            .approved_recipients
            .iter()
            .position(|id| id == &recipient)
        {
            self.approved_recipients.remove(index);
            return true;
        }
        false
    }

    pub fn is_recipient_approved(&self, recipient: AccountId) -> bool {
        self.approved_recipients.contains(&recipient)
    }

    pub fn get_policy(&self) -> PolicyView {
        PolicyView {
            frozen: self.frozen,
            daily_limit: U128(self.daily_limit),
            per_transaction_limit: U128(self.per_transaction_limit),
            approved_recipients: self.approved_recipients.clone(),
            current_utc_day: utc_day(env::block_timestamp_ms()),
        }
    }

    /// Agent-only, zero-deposit payment request.
    /// Amount is a decimal string in JSON via U128.
    pub fn request_payment(
        &mut self,
        request_id: String,
        recipient_id: AccountId,
        amount_yocto: U128,
        invoice_reference: String,
    ) -> Promise {
        self.assert_agent();

        assert_eq!(
            env::attached_deposit().as_yoctonear(),
            0,
            "Payment request must have zero deposit"
        );

        let suffix = request_id.strip_prefix("req_");
        assert!(
            suffix.is_some_and(|s| {
                s.len() == 32
                    && s.bytes()
                        .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
            }),
            "Invalid request ID"
        );

        assert!(
            !invoice_reference.is_empty()
                && invoice_reference.len() <= 128
                && invoice_reference.bytes().all(|b| b.is_ascii_graphic()),
            "Invalid invoice reference"
        );

        assert!(
            !self.payments.contains_key(&request_id),
            "Duplicate request ID"
        );

        assert!(
            self.payments.len() < MAX_PAYMENTS,
            "Payment history capacity reached"
        );

        let today = utc_day(env::block_timestamp_ms());
        let used = if self.daily_day == today {
            self.daily_committed
        } else {
            0
        };

        self.validate_proposal(&recipient_id, amount_yocto.0, used)
            .unwrap_or_else(|error| env::panic_str(&format!("Policy rejected: {error:?}")));

        // Conservative balance check. The fixed margin protects
        // future storage growth and callback execution.
        let storage_reserve = u128::from(env::storage_usage())
            .checked_mul(env::storage_byte_cost().as_yoctonear())
            .and_then(|n| n.checked_add(SAFETY_RESERVE_YOCTO))
            .expect("Storage reserve overflow");

        let required = amount_yocto
            .0
            .checked_add(storage_reserve)
            .expect("Balance reservation overflow");

        assert!(
            required <= env::account_balance().as_yoctonear(),
            "Insufficient unreserved treasury balance"
        );

        let updated_used = used
            .checked_add(amount_yocto.0)
            .expect("Daily allowance overflow");

        let updated_pending = self
            .pending_total
            .checked_add(amount_yocto.0)
            .expect("Pending balance overflow");

        self.daily_day = today;
        self.daily_committed = updated_used;
        self.pending_total = updated_pending;

        self.payments.insert(
            request_id.clone(),
            PaymentRecord {
                recipient_id: recipient_id.clone(),
                amount: amount_yocto.0,
                invoice_reference,
                utc_day: today,
                status: PaymentStatus::Pending,
            },
        );

        env::log_str(&format!("payment_pending:{request_id}"));

        Promise::new(recipient_id)
            .transfer(NearToken::from_yoctonear(amount_yocto.0))
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(Gas::from_tgas(CALLBACK_GAS_TGAS))
                    .on_payment_complete(request_id),
            )
    }

    /// Called only by the contract after the transfer result.
    #[private]
    pub fn on_payment_complete(
        &mut self,
        request_id: String,
        #[callback_result] result: Result<(), PromiseError>,
    ) -> bool {
        assert_eq!(
            env::predecessor_account_id(),
            env::current_account_id(),
            "Only the contract can settle payments"
        );

        let (amount, payment_day) = {
            let Some(payment) = self.payments.get(&request_id) else {
                return false;
            };

            if payment.status != PaymentStatus::Pending {
                return false;
            }

            (payment.amount, payment.utc_day)
        };

        self.pending_total = self
            .pending_total
            .checked_sub(amount)
            .expect("Pending accounting underflow");

        let today = utc_day(env::block_timestamp_ms());

        if self.daily_day != today {
            self.daily_day = today;
            self.daily_committed = 0;
        }

        let succeeded = result.is_ok();

        if !succeeded && payment_day == today {
            self.daily_committed = self
                .daily_committed
                .checked_sub(amount)
                .expect("Daily accounting underflow");
        }

        let payment = self
            .payments
            .get_mut(&request_id)
            .expect("Payment disappeared");

        payment.status = if succeeded {
            PaymentStatus::Confirmed
        } else {
            PaymentStatus::Failed
        };

        env::log_str(&format!("payment_{}:{request_id}", payment.status.as_str()));

        true
    }

    pub fn get_payment(&self, request_id: String) -> Option<PaymentView> {
        self.payments.get(&request_id).map(|payment| PaymentView {
            request_id,
            recipient_id: payment.recipient_id.clone(),
            amount_yocto: U128(payment.amount),
            invoice_reference: payment.invoice_reference.clone(),
            utc_day: payment.utc_day,
            status: payment.status.as_str().to_string(),
        })
    }

    pub fn get_spending(&self) -> SpendingView {
        let today = utc_day(env::block_timestamp_ms());

        let used = if self.daily_day == today {
            self.daily_committed
        } else {
            0
        };

        SpendingView {
            utc_day: today,
            daily_committed: U128(used),
            pending_total: U128(self.pending_total),
            daily_limit: U128(self.daily_limit),
            remaining_daily: U128(self.daily_limit.saturating_sub(used)),
            recorded_payments: self.payments.len() as u64,
        }
    }

    pub fn set_frozen(&mut self, frozen: bool) {
        self.assert_owner();
        self.frozen = frozen;
    }
}

impl NocturneGuard {
    // Internal policy check only. Issue #6 must supply the
    // authoritative on-chain daily committed amount, not
    // a value provided by the agent or frontend.
    #[allow(dead_code)]
    fn validate_proposal(
        &self,
        recipient: &AccountId,
        amount: u128,
        committed_for_day: u128,
    ) -> Result<(), PolicyError> {
        check_payment(
            self.frozen,
            self.approved_recipients.contains(recipient),
            amount,
            self.daily_limit,
            self.per_transaction_limit,
            committed_for_day,
        )
    }

    fn assert_owner(&self) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only the owner can perform this action"
        );
    }

    #[allow(dead_code)]
    fn assert_agent(&self) {
        assert_eq!(
            env::predecessor_account_id(),
            self.agent_id,
            "Only the agent can perform this action"
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn account(id: &str) -> AccountId {
        id.parse().unwrap()
    }

    fn set_caller(caller: &str) {
        let mut context = VMContextBuilder::new();
        context.predecessor_account_id(account(caller));
        testing_env!(context.build());
    }

    fn create_guard() -> NocturneGuard {
        set_caller("owner.testnet");

        NocturneGuard::new(account("owner.testnet"), account("agent.testnet"))
    }

    #[test]
    fn initial_state_is_correct() {
        let guard = create_guard();

        assert_eq!(guard.get_owner(), account("owner.testnet"));
        assert_eq!(guard.get_agent(), account("agent.testnet"));
        assert!(!guard.is_frozen());
    }

    #[test]
    fn owner_can_freeze_and_unfreeze() {
        let mut guard = create_guard();

        guard.set_frozen(true);
        assert!(guard.is_frozen());

        guard.set_frozen(false);
        assert!(!guard.is_frozen());
    }

    #[test]
    #[should_panic(expected = "Only the owner")]
    fn agent_cannot_freeze() {
        let mut guard = create_guard();
        set_caller("agent.testnet");

        guard.set_frozen(true);
    }

    #[test]
    #[should_panic(expected = "Only the owner")]
    fn stranger_cannot_freeze() {
        let mut guard = create_guard();
        set_caller("attacker.testnet");

        guard.set_frozen(true);
    }

    #[test]
    #[should_panic(expected = "Owner and agent must be different")]
    fn owner_and_agent_cannot_be_the_same() {
        set_caller("same.testnet");

        NocturneGuard::new(account("same.testnet"), account("same.testnet"));
    }

    #[test]
    fn agent_passes_agent_authorisation() {
        let guard = create_guard();
        set_caller("agent.testnet");

        guard.assert_agent();
    }

    #[test]
    #[should_panic(expected = "Only the agent")]
    fn owner_cannot_impersonate_agent() {
        let guard = create_guard();
        set_caller("owner.testnet");

        guard.assert_agent();
    }

    #[test]
    #[should_panic(expected = "Only the agent")]
    fn stranger_cannot_impersonate_agent() {
        let guard = create_guard();
        set_caller("attacker.testnet");

        guard.assert_agent();
    }

    #[test]
    #[should_panic(expected = "Only the designated owner")]
    fn stranger_cannot_initialise_for_owner() {
        set_caller("attacker.testnet");

        NocturneGuard::new(account("owner.testnet"), account("agent.testnet"));
    }

    #[test]
    fn signer_does_not_override_predecessor() {
        let guard = create_guard();

        let mut context = VMContextBuilder::new();
        context
            .signer_account_id(account("owner.testnet"))
            .predecessor_account_id(account("attacker.testnet"));
        testing_env!(context.build());

        let result = std::panic::catch_unwind(|| {
            guard.assert_owner();
        });

        assert!(result.is_err());
    }
}
