#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
pids=()
cleanup() { trap - EXIT INT TERM; for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; for pid in "${pids[@]}"; do wait "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
dotnet build src/api/ProjectManager.Api --no-restore
mkdir -p .data
export ConnectionStrings__Projects="Data Source=$ROOT/.data/projects.db"
dotnet src/api/ProjectManager.Api/bin/Debug/net10.0/ProjectManager.Api.dll --urls http://127.0.0.1:5000 & pids+=("$!")
node src/web/node_modules/vite/bin/vite.js src/web --host 127.0.0.1 --port 5173 --strictPort & pids+=("$!")
wait -n "${pids[@]}"
exit 1
