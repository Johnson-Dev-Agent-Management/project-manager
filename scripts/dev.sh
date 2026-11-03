#!/usr/bin/env bash
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
configure_dev_ports
pids=()
cleanup() {
  trap - EXIT INT TERM
  stop_processes "${pids[@]}"
  # A smoke run may remove its storage only after all owned services are reaped.
  if [[ -n ${PROJECT_DEV_CLEANUP_FILE:-} ]]; then
    : > "$PROJECT_DEV_CLEANUP_FILE"
  fi
}
trap 'cleanup' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
python3 scripts/e2e-ports.py "$PROJECT_DEV_API_PORT" "$PROJECT_DEV_WEB_PORT"
dotnet build src/api/ProjectManager.Api --no-restore
data_dir=${PROJECT_DEV_DATA_DIR:-"$ROOT/.data"}
mkdir -p "$data_dir"
database_path=$(native_path "$data_dir/projects.db")
export ConnectionStrings__Projects="Data Source=$database_path"
dotnet src/api/ProjectManager.Api/bin/Debug/net10.0/ProjectManager.Api.dll --urls "http://127.0.0.1:$PROJECT_DEV_API_PORT" & pids+=("$!")
API_URL="http://127.0.0.1:$PROJECT_DEV_API_PORT" node src/web/node_modules/vite/bin/vite.js src/web --host 127.0.0.1 --port "$PROJECT_DEV_WEB_PORT" --strictPort & pids+=("$!")
wait -n "${pids[@]}"
cleanup
exit 1
