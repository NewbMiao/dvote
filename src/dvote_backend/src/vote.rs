use std::collections::BTreeMap;

use candid::{CandidType, Principal};
use ic_cdk::trap;
use serde::Deserialize;

use crate::timestamp::utc_sec;

pub type UserVoteStore = BTreeMap<Principal, UserVoteRecord>; // The key is the user principal, the value is the hash of the vote record and the index of the voted item
pub type VoteStore = BTreeMap<String, VoteRecord>; // The key is the hash of the vote record

#[derive(CandidType, Deserialize, Debug)]
pub enum VoteError {
    NotFound(&'static str),
    BadRequest(&'static str),
    Other(&'static str),
}
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
    pub fn add_created_vote_index(&mut self, hash: String, index: usize) -> bool {
        let vote = self
            .owned
            .get_mut(&hash)
            .unwrap_or_else(|| trap("Vote record not found"));
        if vote.is_none() {
            *vote = Some(vec![]);
        }
        let vote = vote.as_mut().unwrap();
        if vote.contains(&index) {
            return false;
        }
        vote.push(index);
        true
    }
    pub fn add_participated_vote(&mut self, hash: String, index: usize) -> bool {
        let vote = self
            .participated
            .entry(hash)
            .or_insert(Some(vec![]))
            .as_mut()
            .unwrap();
        if vote.contains(&index) {
            return false;
        }
        vote.push(index);
        true
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
        let created_at = utc_sec();
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
    pub fn has_voted(&self) -> bool {
        self.items.iter().any(|item| item.count > 0)
    }
    pub fn is_expired(&self) -> bool {
        utc_sec() > self.expired_at
    }
}
