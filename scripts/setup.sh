#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
[[ $(node --version) == v24.19.0 ]] || { echo 'Node 24.19.0 required' >&2; exit 1; }
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
