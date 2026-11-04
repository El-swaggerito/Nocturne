use near_sdk::{AccountId, PanicOnDefault, env, near};

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct NocturneGuard {
    owner_id: AccountId,
    agent_id: AccountId,
    frozen: bool,
}

#[near]
impl NocturneGuard {
    #[init]
    pub fn new(owner_id: AccountId, agent_id: AccountId) -> Self {
        assert_ne!(owner_id, agent_id, "Owner and agent must be different");

        Self {
            owner_id,
            agent_id,
            frozen: false,
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

    pub fn set_frozen(&mut self, frozen: bool) {
        self.assert_owner();
        self.frozen = frozen;
    }
}

impl NocturneGuard {
    fn assert_owner(&self) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only the owner can perform this action"
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
        set_caller("owner.testnet");

        let mut guard = create_guard();

        guard.set_frozen(true);
        assert!(guard.is_frozen());

        guard.set_frozen(false);
        assert!(!guard.is_frozen());
    }

    #[test]
    #[should_panic(expected = "Only the owner")]
    fn agent_cannot_freeze() {
        set_caller("agent.testnet");

        let mut guard = create_guard();
        guard.set_frozen(true);
    }

    #[test]
    #[should_panic(expected = "Only the owner")]
    fn stranger_cannot_freeze() {
        set_caller("attacker.testnet");

        let mut guard = create_guard();
        guard.set_frozen(true);
    }

    #[test]
    #[should_panic(expected = "Owner and agent must be different")]
    fn owner_and_agent_cannot_be_the_same() {
        NocturneGuard::new(account("same.testnet"), account("same.testnet"));
    }
}
