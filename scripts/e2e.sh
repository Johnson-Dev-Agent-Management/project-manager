#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
if [[ ${CI:-} != true && -z ${PLAYWRIGHT_CHROMIUM_EXECUTABLE:-} ]] && command -v chromium >/dev/null; then
  export PLAYWRIGHT_CHROMIUM_EXECUTABLE=$(command -v chromium)
  echo "Cloud development fallback: $PLAYWRIGHT_CHROMIUM_EXECUTABLE"
fi
rm -rf .artifacts/e2e
mkdir -p .artifacts/e2e
log_dir="$ROOT/.artifacts/e2e"
test_dir=$(mktemp -d)
pids=()
cleanup() { trap - EXIT INT TERM; for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; for pid in "${pids[@]}"; do wait "$pid" 2>/dev/null || true; done; rm -rf "$test_dir"; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
ready() {
  for ((attempt=0; attempt<100; attempt++)); do
    kill -0 "$2" 2>/dev/null || { cat "$log_dir"/*.log >&2; return 1; }
    if curl -fsS "$1" >/dev/null 2>&1; then return 0; fi
    sleep 0.2
  done
  cat "$log_dir"/*.log >&2; return 1
}
dotnet build src/api/ProjectManager.Api --no-restore
database_path=$(native_path "$test_dir/projects.db")
export ConnectionStrings__Projects="Data Source=$database_path"
start_api() {
  dotnet src/api/ProjectManager.Api/bin/Debug/net10.0/ProjectManager.Api.dll --urls http://127.0.0.1:5001 >>"$log_dir/api.log" 2>&1 &
  api_pid=$!; pids+=("$api_pid")
  ready http://127.0.0.1:5001/api/health "$api_pid"
}
start_api
API_URL=http://127.0.0.1:5001 node src/web/node_modules/vite/bin/vite.js src/web --host 127.0.0.1 --port 5174 --strictPort >"$log_dir/web.log" 2>&1 &
web_pid=$!; pids+=("$web_pid")
ready http://127.0.0.1:5174 "$web_pid"
E2E_PHASE=create npm --prefix src/web run e2e
python3 scripts/report.py e2e-create
kill "$api_pid"; wait "$api_pid" || true
pids=("$web_pid")
start_api
E2E_PHASE=restart npm --prefix src/web run e2e
python3 scripts/report.py e2e-restart
