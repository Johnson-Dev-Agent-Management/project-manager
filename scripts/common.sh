#!/usr/bin/env bash
set -Eeuo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PROJECT_TOOLS_DIR=${PROJECT_TOOLS_DIR:-"$ROOT/.tools"}
PROJECT_CACHE_DIR=${PROJECT_CACHE_DIR:-"$ROOT/.cache"}
WINDOWS_SHELL=false
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) WINDOWS_SHELL=true ;;
  *)
    # Reuse a prepared cloud image when present; hosted runners use PATH.
    prepared_root=$(dirname "$ROOT")
    if [[ -x $prepared_root/.node/node_modules/.bin/node ]]; then
      export PATH="$prepared_root/.node/node_modules/.bin:$PATH"
    fi
    if [[ -x $prepared_root/.dotnet/dotnet ]] && ! command -v dotnet >/dev/null; then
      export DOTNET_ROOT="$prepared_root/.dotnet"
      export PATH="$DOTNET_ROOT:$PATH"
    fi
    if [[ -x $PROJECT_TOOLS_DIR/dotnet/dotnet ]]; then
      export DOTNET_ROOT="$PROJECT_TOOLS_DIR/dotnet"
      export PATH="$DOTNET_ROOT:$PATH"
    fi
    export PATH="$PROJECT_TOOLS_DIR/node_modules/.bin:$PATH"
    export DOTNET_CLI_HOME=${DOTNET_CLI_HOME:-"$PROJECT_CACHE_DIR/dotnet"}
    if [[ -z ${NUGET_PACKAGES:-} ]]; then
      if [[ -d $prepared_root/.cache/nuget ]]; then
        export NUGET_PACKAGES="$prepared_root/.cache/nuget"
      else
        export NUGET_PACKAGES="$PROJECT_CACHE_DIR/nuget"
      fi
    fi
    export npm_config_cache=${npm_config_cache:-"$PROJECT_CACHE_DIR/npm"}
    if [[ -z ${PLAYWRIGHT_BROWSERS_PATH:-} && -d $prepared_root/.cache/playwright ]]; then
      export PLAYWRIGHT_BROWSERS_PATH="$prepared_root/.cache/playwright"
    fi
    # .NET runtime locks and NuGet first-use data need writable user paths.
    export XDG_DATA_HOME=${XDG_DATA_HOME:-"$PROJECT_CACHE_DIR/share"}
    export XDG_RUNTIME_DIR=${XDG_RUNTIME_DIR:-"$PROJECT_CACHE_DIR/dotnet/run"}
    mkdir -p "$XDG_RUNTIME_DIR"
    chmod 700 "$XDG_RUNTIME_DIR"
    ;;
esac
export DOTNET_CLI_TELEMETRY_OPTOUT=1
cd "$ROOT"

# Paths embedded in connection strings are not converted by Git Bash for .NET.
native_path() {
  if [[ $WINDOWS_SHELL == true ]]; then
    cygpath -am -- "$1"
  else
    printf '%s\n' "$1"
  fi
}
