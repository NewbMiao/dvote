mod hash;
use candid::{CandidType, Deserialize, Principal};
use hash::hash_string;
use ic_cdk::{api, storage};
use ic_cdk_macros::*;
use std::{cell::RefCell, collections::BTreeMap};

type UserVoteStore = BTreeMap<Principal, UserVoteRecord>; // The key is the user principal, the value is the hash of the vote record and the index of the voted item
type VoteStore = BTreeMap<String, VoteRecord>; // The key is the hash of the vote record

#[derive(Clone, Debug, Default, CandidType, Deserialize)]
struct UserVoteRecord {
    pub owned: BTreeMap<String, Option<Vec<usize>>>,
    pub participated: BTreeMap<String, Option<Vec<usize>>>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
struct VoteRecord {
    pub created_by: Principal,
    pub created_at: u64,
    pub expired_at: u64,
    pub title: String,
    pub max_selection: u8, // default is 1
    pub hash: String,      // The hash of the created_by + title
    pub public: bool, // if true, the vote record will be public in the list, otherwise private only visible via link
    pub items: Vec<VoteItem>,
}
#[derive(Clone, Debug, Default, CandidType, Deserialize)]
struct VoteItem {
    pub index: usize,
    pub name: String,
    pub count: u64,
}
impl UserVoteRecord {
    pub fn new() -> Self {
        Self {
            owned: BTreeMap::new(),
            participated: BTreeMap::new(),
        }
    }
    pub fn add_created_vote(&mut self, hash: String) {
        self.owned.insert(hash, None);
    }
    pub fn add_created_vote_index(&mut self, hash: String, index: usize) {
        let vote = self
            .owned
            .get_mut(&hash)
            .unwrap_or_else(|| panic!("Vote record not found: {}", hash));
        if vote.is_none() {
            *vote = Some(vec![]);
        }
        vote.as_mut().unwrap().push(index);
    }
    pub fn add_participated_vote(&mut self, hash: String, index: usize) {
        let vote = self
            .participated
            .entry(hash)
            .or_insert(Some(vec![]))
            .as_mut()
            .unwrap();
        vote.push(index);
    }
}
impl VoteRecord {
    pub fn new(
        created_by: Principal,
        title: String,
        hash: String,
        expired_at: u64,
        max_selection: u8,
        public: bool,
    ) -> Self {
        let created_at = api::time();
        Self {
            created_by,
            created_at,
            expired_at,
            title,
            max_selection,
            hash,
            public,
            items: Vec::new(),
        }
    }
    pub fn add_vote_item(&mut self, name: String) {
        if !self.is_duplicate(name.clone()) {
            self.items.push(VoteItem {
                index: self.items.len(),
                name,
                count: 0,
            })
        }
    }
    pub fn is_duplicate(&self, name: String) -> bool {
        self.items.iter().any(|item| item.name == name)
    }
    pub fn do_vote(&mut self, index: usize) {
        // check index is in range
        if index >= self.items.len() {
            panic!("Index out of range: {}", index);
        }
        self.items[index].count += 1;
    }
}

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
