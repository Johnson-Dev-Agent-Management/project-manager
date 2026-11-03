#!/usr/bin/env bash
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
pids=()
cleanup() { trap - EXIT INT TERM; stop_processes "${pids[@]}"; }
trap 'cleanup' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
python3 scripts/e2e-ports.py 5000 5173
dotnet build src/api/ProjectManager.Api --no-restore
data_dir=${PROJECT_DEV_DATA_DIR:-"$ROOT/.data"}
mkdir -p "$data_dir"
database_path=$(native_path "$data_dir/projects.db")
export ConnectionStrings__Projects="Data Source=$database_path"
dotnet src/api/ProjectManager.Api/bin/Debug/net10.0/ProjectManager.Api.dll --urls http://127.0.0.1:5000 & pids+=("$!")
node src/web/node_modules/vite/bin/vite.js src/web --host 127.0.0.1 --port 5173 --strictPort & pids+=("$!")
wait -n "${pids[@]}"
cleanup
exit 1
