use candid::{CandidType, Deserialize, Principal};
use ic_cdk::{api, storage};
use ic_cdk_macros::*;
use std::{cell::RefCell, collections::BTreeMap};

type VoteStore = BTreeMap<Principal, BTreeMap<String, Vec<VoteItem>>>;

#[derive(Clone, Debug, Default, CandidType, Deserialize)]
struct VoteItem {
    pub name: String,
    pub count: u64,
}

thread_local! {
    static VOTE_STORE: RefCell<VoteStore> = RefCell::default();
}

#[query(name = "getVote")]
fn get_vote(title: String) -> Vec<VoteItem> {
    let principal = api::caller();
    VOTE_STORE.with(|store| {
        store
            .borrow()
            .get(&principal)
            .and_then(|map| map.get(&title))
            .cloned()
            .unwrap_or_default()
    })
}

#[update(name = "addVote")]
fn add_vote(title: String, names: Vec<String>) -> Vec<VoteItem> {
    let principal = api::caller();
    VOTE_STORE.with(|store| {
        let mut store = store.borrow_mut();
        let map = store.entry(principal).or_default();

        map.entry(title)
            .or_insert_with(|| {
                names
                    .into_iter()
                    .map(|name| VoteItem { name, count: 0 })
                    .collect()
            })
            .clone()
    })
}

#[update(name = "vote")]
fn vote(title: String, name: String) -> Vec<VoteItem> {
    let principal = api::caller();
    VOTE_STORE.with(|store| {
        let mut store = store.borrow_mut();
        let map = store.entry(principal).or_default();
        let items = map.entry(title).or_default();
        for item in items.iter_mut() {
            if item.name == name {
                item.count += 1;
            }
        }
        items.clone()
    })
}

#[pre_upgrade]
fn pre_upgrade() {
    storage::stable_save((VOTE_STORE.with(|store| store.borrow().clone()),)).unwrap();
}
#[post_upgrade]
fn post_upgrade() {
    println!("post upgrade");
    if let Ok((vote_store,)) = storage::stable_restore::<(VoteStore,)>() {
        VOTE_STORE.with(|store| *store.borrow_mut() = vote_store);
    }
}
