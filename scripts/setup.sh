#!/usr/bin/env bash
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
required_node_version=$(<"$ROOT/.nvmrc")
required_npm_version=$(<"$ROOT/.npm-version")
if [[ ${PROJECT_BOOTSTRAP_NODE:-false} == true || $(node --version 2>/dev/null || true) != "v$required_node_version" || $(npm --version 2>/dev/null || true) != "$required_npm_version" ]]; then
  # Bootstrap exact project tools in the writable checkout on every platform,
  # including Windows Git Bash. The host supplies Node/npm only for this install.
  # Install the native binary package directly: the node wrapper's preinstall
  # mutates its Windows bin target after npm has already generated launchers.
  npm install --prefix "$PROJECT_NODE_DIR" --no-save --package-lock=false \
    --ignore-scripts --no-audit --no-fund \
    "$project_node_package@$required_node_version" "npm@$required_npm_version"
  export PATH="$PROJECT_NODE_BIN:$PROJECT_NODE_DIR/node_modules/.bin:$PATH"
  hash -r
fi
[[ $(node --version) == "v$required_node_version" ]] || {
  echo "Node $required_node_version required; found $(node --version)" >&2
  exit 1
}
required_dotnet_version=$(node -p 'require("./global.json").sdk.version')
[[ $(npm --version) == "$required_npm_version" ]] || {
  echo "npm $required_npm_version required; found $(npm --version)" >&2
  exit 1
}
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
  export DOTNET_ROOT="$PROJECT_TOOLS_DIR/dotnet"
  export PATH="$DOTNET_ROOT:$PATH"
  mkdir -p "$DOTNET_ROOT"
  installer=$(mktemp)
  trap 'rm -f "$installer"' EXIT
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o "$installer"
  bash "$installer" --version "$required_dotnet_version" --install-dir "$DOTNET_ROOT" --no-path
  hash -r
fi
[[ $(dotnet --version) == "$required_dotnet_version" ]] || {
  echo ".NET SDK $required_dotnet_version required; found $(dotnet --version)" >&2
  exit 1
}
node --version
npm --version
dotnet --version
npm --prefix src/web ci
dotnet restore tests/ProjectManager.Api.Tests --locked-mode
mkdir -p .data .artifacts
