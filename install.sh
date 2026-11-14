#!/bin/sh
# Install the durable-db binary, verified against its published checksum.
# No root privileges are needed.
#
#   curl -fsSL https://ericflo.github.io/durable-db-site/install.sh | sh
#   curl -fsSL https://ericflo.github.io/durable-db-site/install.sh | sh -s -- v2.1.1
set -eu
version=${1:-v2.1.1}
case "$version" in v[0-9]*) ;; *) echo 'Expected a release tag such as v2.1.1' >&2; exit 1 ;; esac
case "$(uname -s)-$(uname -m)" in
  Linux-x86_64) asset=durable-db-linux-amd64.tar.gz ;;
  *) echo 'Prebuilt binaries are for Linux x86_64. On other platforms, build from source: see docs/development.md.' >&2; exit 1 ;;
esac
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
base="https://github.com/ericflo/durable-db/releases/download/$version"
curl --proto '=https' --tlsv1.2 -fLsS "$base/$asset" -o "$tmp/$asset" \
  && curl --proto '=https' --tlsv1.2 -fLsS "$base/SHA256SUMS" -o "$tmp/SHA256SUMS" \
  || { echo "Could not download $version from $base" >&2; exit 1; }
(cd "$tmp" && sha256sum --check --ignore-missing SHA256SUMS >/dev/null)
tar xzf "$tmp/$asset" -C "$tmp" durable-db
install_dir=${DURABLE_DB_INSTALL_DIR:-$HOME/.local/bin}
mkdir -p "$install_dir"
install -m 0755 "$tmp/durable-db" "$install_dir/durable-db"
printf 'Installed %s in %s\n' "$("$install_dir/durable-db" --version)" "$install_dir"
case ":$PATH:" in *":$install_dir:"*) ;; *) printf 'Add it to your PATH:  export PATH="%s:$PATH"\n' "$install_dir" ;; esac
printf 'Start a server:      durable-db serve --data ./data\n'
