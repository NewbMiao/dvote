mod hash;
mod timestamp;
mod vote;
use candid::{candid_method, Principal};
use hash::hash_string;
use ic_cdk::{api, storage};
use ic_cdk_macros::*;
use std::cell::RefCell;
use timestamp::utc_sec_with_offset;
use vote::{
    CreateVoteRecord, UserVoteRecord, UserVoteStore, VoteError, VoteRecord,
    VoteRecordWithSelection, VoteStore,
};
thread_local! {
    static VOTE_STORE: RefCell<VoteStore> = RefCell::default();
    static USER_VOTE_STORE: RefCell<UserVoteStore> = RefCell::default();
}

#[candid_method(query, rename = "whoami")]
#[query(name = "whoami")]
fn whoami() -> String {
    api::caller().to_string()
}

#[candid_method(query, rename = "getVote")]
#[query(name = "getVote")]
fn get_vote(hash: String) -> Result<VoteRecordWithSelection, VoteError> {
    let principal = api::caller();
    VOTE_STORE.with(|store| {
        if let Some(vote) = store.borrow().get(&hash).cloned() {
            let selection = USER_VOTE_STORE.with(|user_store| {
                if let Some(user_vote_record) = user_store.borrow().get(&principal).cloned() {
                    let vote_item = match vote.created_by == principal {
                        true => user_vote_record.owned.get(&hash).cloned(),
                        false => user_vote_record.participated.get(&hash).cloned(),
                    };
                    if let Some(vote_item) = vote_item {
                        Some(vote_item.selected)
                    } else {
                        None
                    }
                } else {
                    None
                }
            });
            Ok(VoteRecordWithSelection {
                info: vote,
                selection: selection
                    .unwrap_or_default()
                    .iter()
                    .map(|i| i.to_string())
                    .collect(),
            })
        } else {
            return Err(VoteError::NotFound("Vote record not found"));
        }
    })
}

#[candid_method(query, rename = "getMyVote")]
#[query(name = "getMyVote")]
fn get_my_vote() -> Result<UserVoteRecord, VoteError> {
    let principal = api::caller();
    USER_VOTE_STORE.with(|store| {
        store
            .borrow()
            .get(&principal)
            .cloned()
            .ok_or(VoteError::NotFound("No vote record found"))
    })
}

#[candid_method(query, rename = "getPublicVote")]
#[query(name = "getPublicVote")]
fn get_public_vote() -> Result<Vec<VoteRecord>, VoteError> {
    let votes = VOTE_STORE.with(|store| store.borrow().clone());
    if votes.is_empty() {
        return Err(VoteError::NotFound("No vote record found"));
    }
    // filter out the vote records created by the caller

    Ok(votes
        .into_iter()
        // .filter(|(_, v)| v.public && v.created_by != principal)
        .map(|(_, v)| v)
        .collect::<Vec<VoteRecord>>())
}

#[candid_method(update, rename = "createVote")]
#[update(name = "createVote")]
fn create_vote(vote_req: CreateVoteRecord) -> Result<VoteRecord, VoteError> {
    let principal = api::caller();
    if principal == Principal::anonymous() {
        return Err(VoteError::BadRequest(
            "Not allowed to create vote anonymously",
        ));
    }
    let hash = hash_string(&format!("{}{}", principal, vote_req.title.clone()));
    let expired_at = utc_sec_with_offset(60 * 60 * 24 * 7); // 7 days
    let max_selection = 1;
    let public = true;
    VOTE_STORE.with(|store| {
        let mut store = store.borrow_mut();
        let vote_record = store.entry(hash.to_string()).or_insert(VoteRecord::new(
            principal,
            vote_req.title.clone(),
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
        vote_req.names.into_iter().for_each(|name| {
            vote_record.add_vote_item(name);
        });
        USER_VOTE_STORE.with(|user_store| {
            let mut user_store = user_store.borrow_mut();
            let user_vote_record = user_store.entry(principal).or_insert(UserVoteRecord::new());
            user_vote_record.add_created_vote(hash.to_string(), vote_req.title.clone());
        });
        Ok(vote_record.clone())
    })
}

#[candid_method(update, rename = "vote")]
#[update(name = "vote")]
fn vote(hash: String, index: usize) -> Result<VoteRecordWithSelection, VoteError> {
    let principal = api::caller();
    if principal == Principal::anonymous() {
        return Err(VoteError::BadRequest("Not allowed to vote anonymously"));
    }
    VOTE_STORE.with(|store| {
        let mut store = store.borrow_mut();
        let vote_record = store
            .get_mut(&hash)
            .ok_or(VoteError::NotFound("Failed to vote, vote record not found"))?;

        // get vote record
        if vote_record.is_expired() {
            return Err(VoteError::BadRequest(
                "Vote has already expired, not allowed to vote anymore",
            ));
        }
        // voting
        if index >= vote_record.items.len() {
            return Err(VoteError::BadRequest(
                "Vote item not found, index out of range",
            ));
        }

        // update user vote record
        USER_VOTE_STORE.with(|user_store| {
            let mut user_store = user_store.borrow_mut();
            let user_vote_record = user_store.entry(principal).or_insert(UserVoteRecord::new());
            let valid_selection = if vote_record.created_by == principal {
                if user_vote_record.count_owned_vote(hash.clone())
                    >= vote_record.max_selection as usize
                {
                    return Err(VoteError::BadRequest(
                        "You have already voted for the max selection",
                    ));
                }
                user_vote_record.add_created_vote_index(hash.clone(), index)
            } else {
                if user_vote_record.count_participated_vote(hash.clone())
                    >= vote_record.max_selection as usize
                {
                    return Err(VoteError::BadRequest(
                        "You have already voted for the max selection",
                    ));
                }
                user_vote_record.add_participated_vote(
                    hash.clone(),
                    index,
                    vote_record.title.clone(),
                )
            };
            if valid_selection.is_none() {
                return Err(VoteError::BadRequest("You already voted for this vote"));
            }
            vote_record.items[index as usize].count += 1;
            Ok(VoteRecordWithSelection {
                info: vote_record.clone(),
                selection: valid_selection
                    .unwrap()
                    .iter()
                    .map(|i| i.to_string())
                    .collect(),
            })
        })
    })
}

#[pre_upgrade]
fn pre_upgrade() {
    let vote_store = VOTE_STORE.with(|store| store.borrow().clone());
    let user_vote_store = USER_VOTE_STORE.with(|user_store| user_store.borrow().clone());

    storage::stable_save((vote_store, user_vote_store)).unwrap();
}

#[post_upgrade]
fn post_upgrade() {
    if let Ok((vote_store, user_vote_store)) =
        storage::stable_restore::<(VoteStore, UserVoteStore)>()
    {
        VOTE_STORE.with(|store| *store.borrow_mut() = vote_store);
        USER_VOTE_STORE.with(|user_store| *user_store.borrow_mut() = user_vote_store);
    }
}

ic_cdk::export_candid!();
