#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
required_node_version=$(<"$ROOT/.nvmrc")
if [[ $(node --version) != "v$required_node_version" ]]; then
  # The cloud image supplies bootstrap Node/npm; keep the project runtime in
  # the writable workspace. No additional download domain is required.
  npm install --prefix /workspace/.node --no-save --package-lock=false \
    --no-audit --no-fund "node@$required_node_version"
  hash -r
fi
[[ $(node --version) == "v$required_node_version" ]] || {
  echo "Node $required_node_version required; found $(node --version)" >&2
  exit 1
}
if [[ ! -x "$DOTNET_ROOT/dotnet" ]]; then
  mkdir -p "$DOTNET_ROOT"
  installer=$(mktemp)
  trap 'rm -f "$installer"' EXIT
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o "$installer"
  bash "$installer" --version 10.0.401 --install-dir "$DOTNET_ROOT" --no-path
fi
[[ $(dotnet --version) == 10.0.401 ]]
npm --prefix src/web ci
dotnet restore tests/ProjectManager.Api.Tests --locked-mode
mkdir -p .data .artifacts
