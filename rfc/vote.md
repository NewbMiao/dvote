# Vote RFC

DVote is for voting on the blockchain, and the voting results are transparent and cannot be tampered with. User can create a vote, and other users can vote for the vote. The vote can be public or private(only visible via link). The vote can be single selection or multiple selection. The vote can be expired at a specific time.


## Data Structure

Track the voting records of each user, and the voting records of each vote. User can only vote once for each vote. The voting record is stored in the `VoteStore` table, and the voting record of each user is stored in the `UserVoteStore` table.

```rust
type UserVoteStore = BTreeMap<Principal, UserVoteRecord>; // The key is the user principal, the value is the hash of the vote record and the index of the voted item
type VoteStore = BTreeMap<String, VoteRecord>; // The key is the hash of the vote record

#[derive(Clone, Debug, Default, CandidType, Deserialize)]
struct UserVoteRecord {
   pub created_votes:BTreeMap<String, Option<Vec<u8>>>>,
   pub participated_votes:BTreeMap<String, Option<Vec<u8>>>>,
}

#[derive(Clone, Debug, Default, CandidType, Deserialize)]
struct VoteRecord {
    pub created_by: Principal,
    pub created_at: u64,
    pub expired_at: u64,
    pub title: String,
    pub max_selection: u8, // default is 1
    pub hash: String, // The hash of the created_by + title
    pub public: bool, // if true, the vote record will be public in the list, otherwise private only visible via link
    pub vote_items: Vec<VoteItem>,
}
#[derive(Clone, Debug, Default, CandidType, Deserialize)]
struct VoteItem {
    pub index: u8,
    pub name: String,
    pub count: u64,
}
```

## Interface Description

### Create a vote

- `create_vote(title: String, vote_items: Vec<String>) -> VoteRecord`

Create a vote, the `title` is the title of the vote, and the `vote_items` is the list of vote items. The `vote_items` is a `Vec<String>`, and the maximum length is 255. The `VoteRecord` is the vote record, and the `hash` is the hash of the `created_by` and `title`.

- `append_vote_item(hash: String, vote_items: Vec<String>) -> VoteRecord`

Append the `vote_items` to the vote record by the `hash`. The `vote_items` is a `Vec<String>`, not modify the original `vote_items`

- `delete_vote(hash: String) -> VoteRecord`

Delete the vote record by the `hash`. only if the `created_by` is the same as the `caller` and no other user has voted for the vote record.

- `set_vote_public(hash: String, public: bool) -> VoteRecord`

Set the vote record public or private by the `hash`. only if the `created_by` is the same as the `caller`.

- `get_vote(hash: String) -> VoteRecord`

Get the vote record by the `hash`.

- `get_vote_list() -> Vec<VoteRecord>`

Get the list of vote records.

- `get_vote_list_by_user(user: Principal, filter_created: bool) -> Vec<VoteRecord>`

Get the list of vote records by the `user`. filter_created is true, only return the vote records created by the `user`, otherwise return the vote records participated by the `user`.

- `vote(hash: String, index: u8) -> VoteRecord`

Vote for the `hash` by the `index`. The `index` is the index of the `vote_items`. The `VoteRecord` is the vote record. if vote support multiple selection, the `index` will be combined as a `Vec<u8>` in the end.
