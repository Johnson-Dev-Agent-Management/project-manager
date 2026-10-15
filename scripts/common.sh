#!/usr/bin/env bash
set -Eeuo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
WINDOWS_SHELL=false
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) WINDOWS_SHELL=true ;;
  *)
    export DOTNET_ROOT=/workspace/.dotnet
    export PATH="/workspace/.node/node_modules/.bin:$DOTNET_ROOT:$PATH"
    export DOTNET_CLI_HOME=/workspace/.cache/dotnet
    export NUGET_PACKAGES=/workspace/.cache/nuget
    export npm_config_cache=/workspace/.cache/npm
    export PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/playwright
    # .NET runtime locks and NuGet first-use data need writable user paths.
    export XDG_DATA_HOME=/workspace/.cache/share
    export XDG_RUNTIME_DIR=/workspace/.cache/dotnet/run
    mkdir -p "$XDG_RUNTIME_DIR"
    chmod 700 "$XDG_RUNTIME_DIR"
    ;;
esac
export DOTNET_CLI_TELEMETRY_OPTOUT=1
cd "$ROOT"
