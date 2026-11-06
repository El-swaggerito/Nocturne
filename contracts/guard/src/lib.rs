mod policy;
#[cfg(test)]
mod policy_tests;

use near_sdk::json_types::U128;
use near_sdk::{AccountId, PanicOnDefault, env, near};
use policy::{MAX_RECIPIENTS, PolicyError, check_payment, utc_day};

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct NocturneGuard {
    owner_id: AccountId,
    agent_id: AccountId,
    frozen: bool,
    daily_limit: u128,
    per_transaction_limit: u128,
    approved_recipients: Vec<AccountId>,
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
