#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
required_node_version=$(<"$ROOT/.nvmrc")
if [[ $(node --version 2>/dev/null || true) != "v$required_node_version" ]]; then
  if [[ $WINDOWS_SHELL == true ]]; then
    echo "Node.js $required_node_version is required. Install/select it on Windows, reopen Git Bash, and rerun bash scripts/setup.sh." >&2
    exit 1
  fi
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
required_dotnet_version=$(node -p 'require("./global.json").sdk.version')
if [[ $(dotnet --version 2>/dev/null || true) != "$required_dotnet_version" ]]; then
  if [[ $WINDOWS_SHELL == true ]]; then
    cat >&2 <<EOF
.NET SDK $required_dotnet_version is required; it is missing or not available on PATH.
Install the Windows .NET SDK (not just the runtime) from:
https://dotnet.microsoft.com/en-us/download/dotnet/10.0
Reopen Git Bash, confirm 'dotnet --version' prints $required_dotnet_version,
then rerun 'bash scripts/setup.sh'.
EOF
    exit 1
  fi
  mkdir -p "$DOTNET_ROOT"
  installer=$(mktemp)
  trap 'rm -f "$installer"' EXIT
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o "$installer"
  bash "$installer" --version "$required_dotnet_version" --install-dir "$DOTNET_ROOT" --no-path
fi
[[ $(dotnet --version) == "$required_dotnet_version" ]] || {
  echo ".NET SDK $required_dotnet_version required; found $(dotnet --version)" >&2
  exit 1
}
npm --prefix src/web ci
dotnet restore tests/ProjectManager.Api.Tests --locked-mode
mkdir -p .data .artifacts
