#!/bin/sh
# Install the durable-db binary, verified against its published checksum.
# No root privileges are needed.
#
#   curl -fsSL https://ericflo.github.io/durable-db-site/install.sh | sh
#   curl -fsSL https://ericflo.github.io/durable-db-site/install.sh | sh -s -- v2.0.0
set -eu
version=${1:-v2.0.0}
case "$version" in v[0-9]*) ;; *) echo 'Expected a release tag such as v2.0.0' >&2; exit 1 ;; esac
case "$(uname -s)-$(uname -m)" in
  Linux-x86_64) asset=durable-db-linux-amd64.tar.gz ;;
  *) echo 'Prebuilt binaries are for Linux x86_64. On other platforms, build from source: see docs/development.md.' >&2; exit 1 ;;
esac
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
# While the repository is private, releases are fetched with an
# authenticated GitHub CLI.
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  gh release download "$version" --repo ericflo/durable-db --pattern "$asset" --pattern SHA256SUMS --dir "$tmp"
else
  base="https://github.com/ericflo/durable-db/releases/download/$version"
  curl --proto '=https' --tlsv1.2 -fLsS "$base/$asset" -o "$tmp/$asset" \
    && curl --proto '=https' --tlsv1.2 -fLsS "$base/SHA256SUMS" -o "$tmp/SHA256SUMS" \
    || { echo 'Download failed. The repository is private for now: install the GitHub CLI and run `gh auth login`.' >&2; exit 1; }
fi
(cd "$tmp" && sha256sum --check --ignore-missing SHA256SUMS >/dev/null)
tar xzf "$tmp/$asset" -C "$tmp" durable-db
install_dir=${DURABLE_DB_INSTALL_DIR:-$HOME/.local/bin}
mkdir -p "$install_dir"
install -m 0755 "$tmp/durable-db" "$install_dir/durable-db"
printf 'Installed %s in %s\n' "$("$install_dir/durable-db" --version)" "$install_dir"
case ":$PATH:" in *":$install_dir:"*) ;; *) printf 'Add it to your PATH:  export PATH="%s:$PATH"\n' "$install_dir" ;; esac
printf 'Start a server:      durable-db serve --data ./data\n'
