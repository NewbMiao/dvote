#! /bin/bash

package="dvote_backend"
did_file="$package.did"
cargo build --target wasm32-unknown-unknown \
    --release \
    --package "$package" --features "ic-cdk/wasi"

# curl https://wasmtime.dev/install.sh -sSf | bash
wasmtime "target/wasm32-unknown-unknown/release/$package.wasm" >"$did_file"

cat "$did_file"
mv "$did_file" "src/$package/$did_file"

# cargo build --target wasm32-unknown-unknown \
#     --release \
#     --package "$package"

# # cargo install ic-wasm
# ic-wasm "target/wasm32-unknown-unknown/release/$package.wasm" \
#     -o "target/wasm32-unknown-unknown/release/$package.wasm" \
#     metadata candid:service -v public -f "$did_file"
