#!/usr/bin/env bash
set -Eeuo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PROJECT_TOOLS_DIR=${PROJECT_TOOLS_DIR:-"$ROOT/.tools"}
PROJECT_CACHE_DIR=${PROJECT_CACHE_DIR:-"$ROOT/.cache"}
project_node_version=$(<"$ROOT/.nvmrc")
project_npm_version=$(<"$ROOT/.npm-version")
# Versioned directories let Windows upgrade without replacing a running node.exe.
export PROJECT_NODE_DIR=${PROJECT_NODE_DIR:-"$PROJECT_TOOLS_DIR/node-$project_node_version-npm-$project_npm_version"}
project_node_platform=$(node -p 'process.platform')
project_node_arch=$(node -p 'process.arch')
[[ $project_node_platform == win32 ]] && project_node_platform=win
[[ $project_node_platform == win && $project_node_arch == ia32 ]] && project_node_arch=x86
project_node_package="node-$project_node_platform-$project_node_arch"
if [[ $project_node_platform == darwin && $project_node_arch == arm64 ]]; then
  project_node_package=node-bin-darwin-arm64
fi
export PROJECT_NODE_BIN="$PROJECT_NODE_DIR/node_modules/$project_node_package/bin"
WINDOWS_SHELL=false
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    WINDOWS_SHELL=true
    PROJECT_NODE_DIR=$(cygpath -au "$PROJECT_NODE_DIR")
    PROJECT_NODE_BIN=$(cygpath -au "$PROJECT_NODE_BIN")
    ;;
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
# Select workspace Node/npm in every supported Bash shell. Native node.exe must
# precede npm's generated shims on Windows. These directories can appear in setup.
if [[ -x $PROJECT_NODE_BIN/node || -x $PROJECT_NODE_BIN/node.exe ]]; then
  export PATH="$PROJECT_NODE_BIN:$PROJECT_NODE_DIR/node_modules/.bin:$PATH"
fi
if [[ $WINDOWS_SHELL == true ]]; then
  npm_config_cache=${npm_config_cache:-$(cygpath -am "$PROJECT_CACHE_DIR/npm")}
  export npm_config_cache
fi
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
