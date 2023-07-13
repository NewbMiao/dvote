mod hash;
mod timestamp;
mod vote;
use candid::candid_method;
use hash::hash_string;
use ic_cdk::{api, storage};
use ic_cdk_macros::*;
use std::cell::RefCell;
use timestamp::utc_sec_with_offset;
use vote::{UserVoteRecord, UserVoteStore, VoteError, VoteRecord, VoteStore};

thread_local! {
    static VOTE_STORE: RefCell<VoteStore> = RefCell::default();
    static USER_VOTE_STORE: RefCell<UserVoteStore> = RefCell::default();
}

#[candid_method(query, rename = "getVote")]
#[query(name = "getVote")]
fn get_vote(hash: String) -> Result<VoteRecord, VoteError> {
    VOTE_STORE
        .with(|store| store.borrow().get(&hash).cloned())
        .ok_or(VoteError::NotFound("Vote record not found"))
}

#[candid_method(update, rename = "createVote")]
#[update(name = "createVote")]
fn create_vote(title: String, names: Vec<String>) -> Result<VoteRecord, VoteError> {
    let principal = api::caller();
    let hash = hash_string(&format!("{}{}", principal, title));
    let expired_at = utc_sec_with_offset(60 * 60 * 24 * 7); // 7 days
    let max_selection = 1;
    let public = true;
    VOTE_STORE.with(|store| {
        let mut store = store.borrow_mut();
        let vote_record = store.entry(hash.to_string()).or_insert(VoteRecord::new(
            principal,
            title,
            hash.to_string(),
            expired_at,
            max_selection,
            public,
        ));
        if vote_record.has_voted() {
            return Err(VoteError::BadRequest(
                "Vote record already has votes, not allowed to add more items",
            ));
        }
        if vote_record.is_expired() {
            return Err(VoteError::BadRequest(
                "Vote record already has expired, not allowed to add more items",
            ));
        }
        names.into_iter().for_each(|name| {
            vote_record.add_vote_item(name);
        });
        USER_VOTE_STORE.with(|store| {
            let mut store = store.borrow_mut();
            let user_vote_record = store.entry(principal).or_insert(UserVoteRecord::new());
            user_vote_record.add_created_vote(hash.to_string());
        });
        Ok(vote_record.clone())
    })
}

#[candid_method(update, rename = "vote")]
#[update(name = "vote")]
fn vote(hash: String, index: usize) -> Result<VoteRecord, VoteError> {
    let principal = api::caller();
    VOTE_STORE.with(|store| {
        let mut store = store.borrow_mut();
        let vote_record = store
            .get_mut(&hash)
            .ok_or(VoteError::NotFound("Vote record not found"))?;

        // get vote record
        if vote_record.is_expired() {
            return Err(VoteError::BadRequest(
                "Vote record already has expired, not allowed to vote",
            ));
        }
        // voting
        if index >= vote_record.items.len() {
            return Err(VoteError::BadRequest(
                "Vote item not found, index out of range",
            ));
        }
        // update user vote record
        USER_VOTE_STORE.with(|store| {
            let mut store = store.borrow_mut();
            let user_vote_record = store.entry(principal).or_insert(UserVoteRecord::new());
            let succeed = if vote_record.created_by == principal {
                user_vote_record.add_created_vote_index(hash.clone(), index)
            } else {
                user_vote_record.add_participated_vote(hash.clone(), index)
            };
            if !succeed {
                return Err(VoteError::BadRequest(
                    "User already voted for this vote record",
                ));
            }
            vote_record.items[index].count += 1;
            Ok(vote_record.clone())
        })
    })
}

#[pre_upgrade]
fn pre_upgrade() {
    storage::stable_save((VOTE_STORE.with(|store| store.borrow().clone()),)).unwrap();
    storage::stable_save((USER_VOTE_STORE.with(|store| store.borrow().clone()),)).unwrap();
}
#[post_upgrade]
fn post_upgrade() {
    if let Ok((vote_store,)) = storage::stable_restore::<(VoteStore,)>() {
        VOTE_STORE.with(|store| *store.borrow_mut() = vote_store);
    }
    if let Ok((user_vote_store,)) = storage::stable_restore::<(UserVoteStore,)>() {
        USER_VOTE_STORE.with(|store| *store.borrow_mut() = user_vote_store);
    }
}

// When run on native this prints the candid service definition of this
// canister, from the methods annotated with `candid_method` above.
//
// Note that `cargo test` calls `main`, and `export_service` (which defines
// `__export_service` in the current scope) needs to be called exactly once. So
// in addition to `not(target_arch = "wasm32")` we have a `not(test)` guard here
// to avoid calling `export_service`, which we need to call in the test below.
#[cfg(not(any(target_arch = "wasm32", test)))]
fn main() {
    // The line below generates did types and service definition from the
    // methods annotated with `candid_method` above. The definition is then
    // obtained with `__export_service()`.
    candid::export_service!();
    std::print!("{}", __export_service());
}

// -----------------------------------------------------------------------------------------------
// When run on native this prints the candid service definition of this
// canister, from the methods annotated with `candid_method` above.
//
// Note that `cargo test` calls `main`, and `export_service` (which defines
// `__export_service` in the current scope) needs to be called exactly once. So
// in addition to `not(target_arch = "wasm32")` we have a `not(test)` guard here
// to avoid calling `export_service`, which we need to call in the test below.
#[cfg(not(any(target_arch = "wasm32", test)))]
fn main() {
    // The line below generates did types and service definition from the
    // methods annotated with `candid_method` above. The definition is then
    // obtained with `__export_service()`.
    candid::export_service!();
    std::print!("{}", __export_service());
}

// #[cfg(any(target_arch = "wasm32", test))]
// fn main() {}

#[test]
fn check_vote_candid_file() {
    let governance_did = String::from_utf8(std::fs::read("dvote_backend.did").unwrap()).unwrap();

    // See comments in main above
    candid::export_service!();
    let expected = __export_service();

    if governance_did != expected {
        println!(
            "Generated candid definition:----------\n\n{}\n\n----------",
            expected
        );
        panic!(
            "Generated candid definition does not match dvote_backend.did. \
            Run `cargo run --bin gen-did > dvote_backend.did` in \
            src/dvote_backend to update dvote_backend.did."
        )
    }
}
