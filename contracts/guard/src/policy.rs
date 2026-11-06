pub const MAX_RECIPIENTS: usize = 64;
pub const MILLIS_PER_DAY: u64 = 86_400_000;

#[derive(Debug, PartialEq, Eq)]
pub enum PolicyError {
    Frozen,
    RecipientNotApproved,
    ZeroAmount,
    TransactionLimitExceeded,
    DailyLimitExceeded,
    ArithmeticOverflow,
}

pub fn utc_day(timestamp_ms: u64) -> u64 {
    timestamp_ms / MILLIS_PER_DAY
}

pub fn check_payment(
    frozen: bool,
    approved: bool,
    amount: u128,
    daily_limit: u128,
    transaction_limit: u128,
    committed: u128,
) -> Result<(), PolicyError> {
    if frozen {
        return Err(PolicyError::Frozen);
    }
    if !approved {
        return Err(PolicyError::RecipientNotApproved);
    }
    if amount == 0 {
        return Err(PolicyError::ZeroAmount);
    }
    if amount > transaction_limit {
        return Err(PolicyError::TransactionLimitExceeded);
    }

    let new_total = committed
        .checked_add(amount)
        .ok_or(PolicyError::ArithmeticOverflow)?;

    if new_total > daily_limit {
        return Err(PolicyError::DailyLimitExceeded);
    }
    Ok(())
}
