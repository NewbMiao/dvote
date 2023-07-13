mod hash;
mod vote;
use candid::{CandidType, Deserialize, Principal};
use hash::hash_string;
use ic_cdk::{api, storage};
use ic_cdk_macros::*;
use std::{cell::RefCell, collections::BTreeMap};
use vote::{UserVoteRecord, UserVoteStore, VoteRecord, VoteStore};

thread_local! {
    static VOTE_STORE: RefCell<VoteStore> = RefCell::default();
    static USER_VOTE_STORE: RefCell<UserVoteStore> = RefCell::default();
}

#[query(name = "getVote")]
fn get_vote(hash: String) -> Option<VoteRecord> {
    VOTE_STORE.with(|store| store.borrow().get(&hash).cloned())
}

#[update(name = "createVote")]
fn create_vote(title: String, names: Vec<String>) -> VoteRecord {
    let principal = api::caller();
    let hash = hash_string(&format!("{}{}", principal, title));
    let expired_at = api::time() + 60 * 60 * 24 * 7; // 7 days
    let max_selection = 1;
    let public = true;
    let result = VOTE_STORE.with(|store| {
        let mut store = store.borrow_mut();
        let vote_record = store.entry(hash.to_string()).or_insert(VoteRecord::new(
            principal,
            title,
            hash.to_string(),
            expired_at,
            max_selection,
            public,
        ));
        names.into_iter().for_each(|name| {
            vote_record.add_vote_item(name);
        });
        vote_record.clone()
    });
    // shared hash string

    USER_VOTE_STORE.with(|store| {
        let mut store = store.borrow_mut();
        let user_vote_record = store.entry(principal).or_insert(UserVoteRecord::new());
        user_vote_record.add_created_vote(hash.to_string());
    });
    result
}

#[update(name = "vote")]
fn vote(hash: String, index: usize) -> VoteRecord {
    let principal = api::caller();
    let result = VOTE_STORE.with(|store| {
        let mut store = store.borrow_mut();
        let vote_record = store
            .get_mut(&hash)
            .unwrap_or_else(|| panic!("Vote record not found: {}", hash));
        vote_record.do_vote(index);
        vote_record.clone()
    });
    USER_VOTE_STORE.with(|store| {
        let mut store = store.borrow_mut();
        let user_vote_record = store.entry(principal).or_insert(UserVoteRecord::new());
        user_vote_record.add_participated_vote(hash.clone(), index);
    });
    result
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
