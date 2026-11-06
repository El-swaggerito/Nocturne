//! Sandbox security tests (Issue #7).
//!
//! These deploy the real Guard Wasm to a local NEAR node and send real
//! transactions, so they prove receipt and callback behaviour that unit
//! tests with mocked `promise_results` cannot. Nothing touches testnet.
//!
//! Run with: cargo test -p nocturne_integration_tests
use near_workspaces::result::ExecutionFinalResult;
use near_workspaces::types::{Gas, NearToken};
use near_workspaces::{Account, AccountId, Contract, Worker, network::Sandbox};
use serde_json::{Value, json};

const ONE_NEAR: u128 = 1_000_000_000_000_000_000_000_000;
const DAILY_LIMIT: u128 = 10 * ONE_NEAR;
const TX_LIMIT: u128 = 8 * ONE_NEAR;
/// Same prepaid gas as the agent client (`agent/src/near.ts`).
const REQUEST_GAS: Gas = Gas::from_tgas(100);

struct Env {
    worker: Worker<Sandbox>,
    guard: Contract,
    owner: Account,
    agent: Account,
    merchant: Account,
    attacker: Account,
}

fn yocto(n: u128) -> String {
    n.to_string()
}

fn req_id(n: u128) -> String {
    format!("req_{n:032x}")
}

async fn account(worker: &Worker<Sandbox>, name: &str, near: u128) -> anyhow::Result<Account> {
    Ok(worker
        .root_account()?
        .create_subaccount(name)
        .initial_balance(NearToken::from_near(near))
        .transact()
        .await?
        .into_result()?)
}

/// Guard funded with `guard_near` NEAR, initialised by the owner with a
/// 10 NEAR daily cap, 8 NEAR per-payment cap and `merchant` approved.
async fn setup_with_balance(guard_near: u128) -> anyhow::Result<Env> {
    let wasm = near_workspaces::compile_project("../contracts/guard").await?;
    let worker = near_workspaces::sandbox().await?;
    let guard_account = account(&worker, "guard", guard_near).await?;
    let guard = guard_account.deploy(&wasm).await?.into_result()?;
    let owner = account(&worker, "owner", 20).await?;
    let agent = account(&worker, "agent", 20).await?;
    let merchant = account(&worker, "merchant", 5).await?;
    let attacker = account(&worker, "attacker", 20).await?;

    owner
        .call(guard.id(), "new")
        .args_json(json!({ "owner_id": owner.id(), "agent_id": agent.id() }))
        .transact()
        .await?
        .into_result()?;
    owner
        .call(guard.id(), "set_limits")
        .args_json(
            json!({ "daily_limit": yocto(DAILY_LIMIT), "per_transaction_limit": yocto(TX_LIMIT) }),
        )
        .transact()
        .await?
        .into_result()?;
    owner
        .call(guard.id(), "add_approved_recipient")
        .args_json(json!({ "recipient": merchant.id() }))
        .transact()
        .await?
        .into_result()?;

    Ok(Env {
        worker,
        guard,
        owner,
        agent,
        merchant,
        attacker,
    })
}

async fn setup() -> anyhow::Result<Env> {
    setup_with_balance(50).await
}

async fn request(
    env: &Env,
    signer: &Account,
    n: u128,
    recipient: &AccountId,
    amount: u128,
) -> anyhow::Result<ExecutionFinalResult> {
    Ok(signer
        .call(env.guard.id(), "request_payment")
        .args_json(json!({
            "request_id": req_id(n),
            "recipient_id": recipient,
            "amount_yocto": yocto(amount),
            "invoice_reference": format!("INV-{n}"),
        }))
        .gas(REQUEST_GAS)
        .transact()
        .await?)
}

/// The transaction must fail, and the failure must mention `needle`.
fn assert_rejected(result: &ExecutionFinalResult, needle: &str) {
    assert!(
        result.is_failure(),
        "expected rejection containing {needle:?}, got success"
    );
    let text = format!("{:?}", result.clone().into_result().unwrap_err());
    assert!(
        text.contains(needle),
        "expected {needle:?} in failure, got: {text}"
    );
}

async fn balance(env: &Env, id: &AccountId) -> anyhow::Result<u128> {
    Ok(env.worker.view_account(id).await?.balance.as_yoctonear())
}

async fn spending(env: &Env) -> anyhow::Result<Value> {
    Ok(env.guard.view("get_spending").await?.json()?)
}

async fn payment(env: &Env, n: u128) -> anyhow::Result<Value> {
    Ok(env
        .guard
        .view("get_payment")
        .args_json(json!({ "request_id": req_id(n) }))
        .await?
        .json()?)
}

fn as_u128(v: &Value) -> u128 {
    v.as_str()
        .expect("U128 must be a JSON string")
        .parse()
        .unwrap()
}

// ---------------------------------------------------------------- roles (I1-I3)

#[tokio::test]
async fn stranger_cannot_initialise_guard() -> anyhow::Result<()> {
    let wasm = near_workspaces::compile_project("../contracts/guard").await?;
    let worker = near_workspaces::sandbox().await?;
    let guard = worker.dev_deploy(&wasm).await?;
    let owner = worker.dev_create_account().await?;
    let agent = worker.dev_create_account().await?;
    let attacker = worker.dev_create_account().await?;

    let res = attacker
        .call(guard.id(), "new")
        .args_json(json!({ "owner_id": owner.id(), "agent_id": agent.id() }))
        .transact()
        .await?;
    assert_rejected(&res, "Only the designated owner can initialise");
    Ok(())
}

#[tokio::test]
async fn non_owner_policy_mutations_are_rejected_on_chain() -> anyhow::Result<()> {
    let env = setup().await?;
    for caller in [&env.agent, &env.attacker] {
        let calls = [
            ("set_frozen", json!({ "frozen": true })),
            (
                "set_limits",
                json!({ "daily_limit": yocto(1000 * ONE_NEAR), "per_transaction_limit": yocto(1000 * ONE_NEAR) }),
            ),
            (
                "add_approved_recipient",
                json!({ "recipient": env.attacker.id() }),
            ),
            (
                "remove_approved_recipient",
                json!({ "recipient": env.merchant.id() }),
            ),
        ];
        for (method, args) in calls {
            let res = caller
                .call(env.guard.id(), method)
                .args_json(args)
                .transact()
                .await?;
            assert_rejected(&res, "Only the owner can perform this action");
        }
    }
    let policy: Value = env.guard.view("get_policy").await?.json()?;
    assert_eq!(policy["frozen"], false);
    assert_eq!(as_u128(&policy["daily_limit"]), DAILY_LIMIT);
    assert_eq!(policy["approved_recipients"], json!([env.merchant.id()]));
    Ok(())
}

#[tokio::test]
async fn only_agent_can_request_payment() -> anyhow::Result<()> {
    let env = setup().await?;
    for caller in [&env.owner, &env.attacker] {
        let res = request(&env, caller, 1, env.merchant.id(), ONE_NEAR).await?;
        assert_rejected(&res, "Only the agent can perform this action");
    }
    Ok(())
}

#[tokio::test]
async fn settlement_callback_cannot_be_called_externally() -> anyhow::Result<()> {
    let env = setup().await?;
    request(&env, &env.agent, 1, env.merchant.id(), ONE_NEAR)
        .await?
        .into_result()?;

    for caller in [&env.attacker, &env.agent, &env.owner] {
        let res = caller
            .call(env.guard.id(), "on_payment_complete")
            .args_json(json!({ "request_id": req_id(1) }))
            .transact()
            .await?;
        assert_rejected(&res, "is private");
    }
    assert_eq!(payment(&env, 1).await?["status"], "confirmed");
    Ok(())
}

// ---------------------------------------------------------------- payments (I4-I9)

#[tokio::test]
async fn approved_payment_transfers_exact_amount_and_confirms() -> anyhow::Result<()> {
    let env = setup().await?;
    let before = balance(&env, env.merchant.id()).await?;

    let res = request(&env, &env.agent, 1, env.merchant.id(), 3 * ONE_NEAR).await?;
    assert!(res.is_success(), "{res:?}");
    assert!(
        res.receipt_failures().is_empty(),
        "{:?}",
        res.receipt_failures()
    );

    assert_eq!(
        balance(&env, env.merchant.id()).await? - before,
        3 * ONE_NEAR
    );
    assert_eq!(payment(&env, 1).await?["status"], "confirmed");
    let s = spending(&env).await?;
    assert_eq!(as_u128(&s["pending_total"]), 0);
    assert_eq!(as_u128(&s["daily_committed"]), 3 * ONE_NEAR);
    Ok(())
}

#[tokio::test]
async fn redirected_recipient_is_rejected_and_unpaid() -> anyhow::Result<()> {
    // Demo scenario 2: a poisoned invoice makes the agent propose the attacker.
    let env = setup().await?;
    let before = balance(&env, env.attacker.id()).await?;

    let res = request(&env, &env.agent, 1, env.attacker.id(), ONE_NEAR).await?;
    assert_rejected(&res, "RecipientNotApproved");

    assert_eq!(balance(&env, env.attacker.id()).await?, before);
    assert_eq!(payment(&env, 1).await?, Value::Null);
    assert_eq!(as_u128(&spending(&env).await?["daily_committed"]), 0);
    Ok(())
}

#[tokio::test]
async fn per_payment_cap_is_exact() -> anyhow::Result<()> {
    let env = setup().await?;
    let res = request(&env, &env.agent, 1, env.merchant.id(), TX_LIMIT + 1).await?;
    assert_rejected(&res, "TransactionLimitExceeded");

    let res = request(&env, &env.agent, 2, env.merchant.id(), TX_LIMIT).await?;
    assert!(res.is_success(), "{res:?}");
    Ok(())
}

#[tokio::test]
async fn daily_cap_holds_across_sequential_payments() -> anyhow::Result<()> {
    let env = setup().await?;
    request(&env, &env.agent, 1, env.merchant.id(), 8 * ONE_NEAR)
        .await?
        .into_result()?;

    let res = request(&env, &env.agent, 2, env.merchant.id(), 2 * ONE_NEAR + 1).await?;
    assert_rejected(&res, "DailyLimitExceeded");

    let res = request(&env, &env.agent, 3, env.merchant.id(), 2 * ONE_NEAR).await?;
    assert!(res.is_success(), "{res:?}");
    assert_eq!(as_u128(&spending(&env).await?["remaining_daily"]), 0);
    Ok(())
}

#[tokio::test]
async fn concurrent_requests_cannot_both_reserve_against_daily_cap() -> anyhow::Result<()> {
    // Issue #6 acceptance criterion, with real in-flight receipts.
    let env = setup().await?;
    let before = balance(&env, env.merchant.id()).await?;

    let call = |n: u128| {
        env.agent
            .call(env.guard.id(), "request_payment")
            .args_json(json!({
                "request_id": req_id(n),
                "recipient_id": env.merchant.id(),
                "amount_yocto": yocto(8 * ONE_NEAR),
                "invoice_reference": format!("INV-{n}"),
            }))
            .gas(REQUEST_GAS)
            .transact_async()
    };
    let (a, b) = (call(1).await?, call(2).await?);
    let (a, b) = (a.await?, b.await?);

    assert_eq!(
        [a.is_success(), b.is_success()]
            .iter()
            .filter(|ok| **ok)
            .count(),
        1,
        "exactly one of two concurrent 8 NEAR requests may succeed: {a:?} {b:?}"
    );
    let rejected = if a.is_success() { &b } else { &a };
    assert_rejected(rejected, "DailyLimitExceeded");
    assert_eq!(
        balance(&env, env.merchant.id()).await? - before,
        8 * ONE_NEAR
    );
    Ok(())
}

#[tokio::test]
async fn duplicate_request_id_never_pays_twice() -> anyhow::Result<()> {
    let env = setup().await?;
    let before = balance(&env, env.merchant.id()).await?;

    request(&env, &env.agent, 1, env.merchant.id(), ONE_NEAR)
        .await?
        .into_result()?;
    let res = request(&env, &env.agent, 1, env.merchant.id(), ONE_NEAR).await?;
    assert_rejected(&res, "Duplicate request ID");

    assert_eq!(balance(&env, env.merchant.id()).await? - before, ONE_NEAR);
    Ok(())
}

#[tokio::test]
async fn freeze_blocks_new_payments_and_unfreeze_restores() -> anyhow::Result<()> {
    // Demo scenario 4.
    let env = setup().await?;
    env.owner
        .call(env.guard.id(), "set_frozen")
        .args_json(json!({ "frozen": true }))
        .transact()
        .await?
        .into_result()?;

    let res = request(&env, &env.agent, 1, env.merchant.id(), ONE_NEAR).await?;
    assert_rejected(&res, "Frozen");

    env.owner
        .call(env.guard.id(), "set_frozen")
        .args_json(json!({ "frozen": false }))
        .transact()
        .await?
        .into_result()?;
    let res = request(&env, &env.agent, 2, env.merchant.id(), ONE_NEAR).await?;
    assert!(res.is_success(), "{res:?}");
    Ok(())
}

#[tokio::test]
async fn attached_deposit_is_rejected() -> anyhow::Result<()> {
    let env = setup().await?;
    let res = env
        .agent
        .call(env.guard.id(), "request_payment")
        .args_json(json!({
            "request_id": req_id(1),
            "recipient_id": env.merchant.id(),
            "amount_yocto": yocto(ONE_NEAR),
            "invoice_reference": "INV-1",
        }))
        .deposit(NearToken::from_yoctonear(1))
        .gas(REQUEST_GAS)
        .transact()
        .await?;
    assert_rejected(&res, "doesn't accept deposit");
    Ok(())
}

#[tokio::test]
async fn amount_as_json_number_is_rejected() -> anyhow::Result<()> {
    // I12: amounts must cross JSON as decimal strings, never JS numbers.
    let env = setup().await?;
    let res = env
        .agent
        .call(env.guard.id(), "request_payment")
        .args_json(json!({
            "request_id": req_id(1),
            "recipient_id": env.merchant.id(),
            "amount_yocto": 1_000_000_u64,
            "invoice_reference": "INV-1",
        }))
        .gas(REQUEST_GAS)
        .transact()
        .await?;
    assert!(
        res.is_failure(),
        "numeric amount must not be accepted: {res:?}"
    );
    Ok(())
}

#[tokio::test]
async fn failed_transfer_is_marked_failed_and_allowance_restored() -> anyhow::Result<()> {
    // T9 / I9: transfer to an approved but non-existent named account.
    let env = setup().await?;
    let ghost: AccountId = format!("ghost.{}", env.worker.root_account()?.id()).parse()?;
    env.owner
        .call(env.guard.id(), "add_approved_recipient")
        .args_json(json!({ "recipient": ghost }))
        .transact()
        .await?
        .into_result()?;

    let res = request(&env, &env.agent, 1, &ghost, 5 * ONE_NEAR).await?;
    assert!(
        !res.receipt_failures().is_empty(),
        "transfer to {ghost} should fail: {res:?}"
    );

    assert_eq!(payment(&env, 1).await?["status"], "failed");
    let s = spending(&env).await?;
    assert_eq!(as_u128(&s["pending_total"]), 0);
    assert_eq!(as_u128(&s["daily_committed"]), 0);
    assert!(
        env.worker.view_account(&ghost).await.is_err(),
        "ghost account must not exist"
    );

    // The released allowance is really usable again.
    let res = request(&env, &env.agent, 2, env.merchant.id(), 8 * ONE_NEAR).await?;
    assert!(res.is_success(), "{res:?}");
    Ok(())
}

#[tokio::test]
async fn payment_cannot_spend_storage_reserve() -> anyhow::Result<()> {
    // T13 / I6: a small treasury can't be drained below its storage reserve.
    let env = setup_with_balance(6).await?;
    let res = request(&env, &env.agent, 1, env.merchant.id(), 5 * ONE_NEAR).await?;
    assert_rejected(&res, "Insufficient unreserved treasury balance");
    Ok(())
}

// ---------------------------------------------------------------- findings
// Ignored tests assert the behaviour we WANT. They fail on the current
// contract; see docs/security/contract-review.md. Run them with:
//   cargo test -p nocturne_integration_tests -- --ignored

const F2_AMOUNT: u128 = 3 * ONE_NEAR;

/// A Guard funded with exactly: storage reserve + two 3 NEAR payments + 1 NEAR
/// slack. The reserve is measured on a probe Guard with identical setup.
async fn setup_for_two_payments() -> anyhow::Result<Env> {
    let probe = setup().await?;
    let usage = u128::from(
        probe
            .worker
            .view_account(probe.guard.id())
            .await?
            .storage_usage,
    );
    let reserve = usage * 10_000_000_000_000_000_000 + ONE_NEAR;
    setup_with_balance((reserve + 2 * F2_AMOUNT + ONE_NEAR).div_ceil(ONE_NEAR)).await
}

#[tokio::test]
async fn control_f2_treasury_covers_two_sequential_payments() -> anyhow::Result<()> {
    let env = setup_for_two_payments().await?;
    for n in [1, 2] {
        let res = request(&env, &env.agent, n, env.merchant.id(), F2_AMOUNT).await?;
        assert!(res.is_success(), "payment {n}: {res:?}");
    }
    Ok(())
}

#[tokio::test]
#[ignore = "F2: pending transfers are counted twice against the treasury balance"]
async fn finding_f2_affordable_concurrent_payments_are_both_accepted() -> anyhow::Result<()> {
    let env = setup_for_two_payments().await?;
    let amount = F2_AMOUNT;

    let call = |n: u128| {
        env.agent
            .call(env.guard.id(), "request_payment")
            .args_json(json!({
                "request_id": req_id(n),
                "recipient_id": env.merchant.id(),
                "amount_yocto": yocto(amount),
                "invoice_reference": format!("INV-{n}"),
            }))
            .gas(REQUEST_GAS)
            .transact_async()
    };
    let (a, b) = (call(1).await?, call(2).await?);
    let (a, b) = (a.await?, b.await?);
    assert!(a.is_success(), "first: {a:?}");
    assert!(
        b.is_success(),
        "treasury covers both payments, second was rejected: {b:?}"
    );
    Ok(())
}
