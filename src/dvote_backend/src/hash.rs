use md5::Digest;
use md5::Md5;
use std::io::Write;
pub fn hash_string(input: &str) -> String {
    let mut hasher = Md5::new();
    hasher.write_all(input.as_bytes()).unwrap();
    let result = hasher.finalize();
    format!("{:x}", result)
}
