use near_sdk::json_types::U128;
use near_sdk::{AccountId, near};

pub const MAX_PAYMENTS: usize = 256;
pub const CALLBACK_GAS_TGAS: u64 = 25;
pub const SAFETY_RESERVE_YOCTO: u128 = 1_000_000_000_000_000_000_000_000;

#[near(serializers = [borsh])]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum PaymentStatus {
    Pending,
    Confirmed,
    Failed,
}

impl PaymentStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Confirmed => "confirmed",
            Self::Failed => "failed",
        }
    }
}

#[near(serializers = [borsh])]
pub struct PaymentRecord {
    pub recipient_id: AccountId,
    pub amount: u128,
    pub invoice_reference: String,
    pub utc_day: u64,
    pub status: PaymentStatus,
}

#[near(serializers = [json])]
pub struct PaymentView {
    pub request_id: String,
    pub recipient_id: AccountId,
    pub amount_yocto: U128,
    pub invoice_reference: String,
    pub utc_day: u64,
    pub status: String,
}

#[near(serializers = [json])]
pub struct SpendingView {
    pub utc_day: u64,
    pub daily_committed: U128,
    pub pending_total: U128,
    pub daily_limit: U128,
    pub remaining_daily: U128,
    pub recorded_payments: u64,
}
