#! /bin/bash

package="dvote_backend"
did_file="src/$package/$package.did"
# install rustup and cargo 
if ! command -v rustup &>/dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
fi
if ! command -v cargo &>/dev/null; then
    source "$HOME/.cargo/env"
fi

rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown \
    --release \
    --package "$package" --features "ic-cdk/wasi"

# curl https://wasmtime.dev/install.sh -sSf | bash
wasmtime "target/wasm32-unknown-unknown/release/$package.wasm" >"$did_file"

printf "\n\n// https://github.com/dfinity/candid/blob/master/spec/Candid.md" >>$did_file
cat "$did_file"

cargo build --target wasm32-unknown-unknown \
    --release \
    --package "$package"

# cargo install ic-wasm
ic-wasm "target/wasm32-unknown-unknown/release/$package.wasm" \
    -o "target/wasm32-unknown-unknown/release/$package.wasm" \
    metadata candid:service -v public -f "$did_file"
