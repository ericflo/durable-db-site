#!/bin/sh
# Install a checksum-verified release executable. No root privileges required.
set -eu
version=${1:-v0.23.1}
case "$version" in v[0-9]*);; *) echo 'Expected a release tag such as v0.23.1' >&2; exit 1;; esac
case "$(uname -s)-$(uname -m)" in
  Linux-x86_64) asset=durable-db-linux-amd64.tar.gz;;
  *) echo 'Prebuilt binaries currently target Linux x86_64; build from source for this platform.' >&2; exit 1;;
esac
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  gh release download "$version" --repo ericflo/durable-db --pattern "$asset" --pattern SHA256SUMS --dir "$tmp"
else
  base="https://github.com/ericflo/durable-db/releases/download/$version"
  curl --proto '=https' --tlsv1.2 -fLsS "$base/$asset" -o "$tmp/$asset"
  curl --proto '=https' --tlsv1.2 -fLsS "$base/SHA256SUMS" -o "$tmp/SHA256SUMS"
fi
(cd "$tmp" && sha256sum --check --ignore-missing SHA256SUMS)
tar xzf "$tmp/$asset" -C "$tmp" durable-db
install_dir=${DURABLE_DB_INSTALL_DIR:-$HOME/.local/bin}
mkdir -p "$install_dir"
install -m 0755 "$tmp/durable-db" "$install_dir/durable-db"
"$install_dir/durable-db" --version
printf 'Installed %s/durable-db\n' "$install_dir"
