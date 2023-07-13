use ic_cdk::api;

pub fn utc_sec() -> u64 {
    api::time() / 1_000_000_000
}

pub fn utc_sec_with_offset(offset: u64) -> u64 {
    api::time() / 1_000_000_000 + offset
}
