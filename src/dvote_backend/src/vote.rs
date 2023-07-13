use std::collections::BTreeMap;

use candid::{CandidType, Principal};
use ic_cdk::api;
use serde::Deserialize;

pub type UserVoteStore = BTreeMap<Principal, UserVoteRecord>; // The key is the user principal, the value is the hash of the vote record and the index of the voted item
pub type VoteStore = BTreeMap<String, VoteRecord>; // The key is the hash of the vote record

#[derive(Clone, Debug, Default, CandidType, Deserialize)]
pub struct UserVoteRecord {
    pub owned: BTreeMap<String, Option<Vec<usize>>>,
    pub participated: BTreeMap<String, Option<Vec<usize>>>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct VoteRecord {
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
pub struct VoteItem {
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
