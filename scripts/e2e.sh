#!/usr/bin/env bash
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
case "${1:-build}" in
  build) bash scripts/production-build.sh ;;
  --use-builds) ;;
  *) echo 'Usage: e2e.sh [--use-builds]' >&2; exit 2 ;;
esac
python3 scripts/build-output.py verify web
python3 scripts/build-output.py verify api
if [[ ${CI:-} != true && -z ${PLAYWRIGHT_CHROMIUM_EXECUTABLE:-} ]] && command -v chromium >/dev/null; then
  PLAYWRIGHT_CHROMIUM_EXECUTABLE=$(command -v chromium)
  export PLAYWRIGHT_CHROMIUM_EXECUTABLE
  echo "Cloud development fallback: $PLAYWRIGHT_CHROMIUM_EXECUTABLE"
fi
mkdir -p .artifacts/e2e
E2E_ARTIFACT_DIR=$(mktemp -d "$ROOT/.artifacts/e2e/run-XXXXXX")
export E2E_ARTIFACT_DIR
log_dir=$E2E_ARTIFACT_DIR
test_dir=$(mktemp -d)
pids=()
cleanup() {
  result=$?
  trap - EXIT INT TERM
  for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
  for ((attempt=0; attempt<50; attempt++)); do
    alive=false
    for pid in "${pids[@]}"; do
      if kill -0 "$pid" 2>/dev/null; then alive=true; fi
    done
    [[ $alive == false ]] && break
    sleep 0.1
  done
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then kill -KILL "$pid" 2>/dev/null || true; fi
    wait "$pid" 2>/dev/null || true
  done
  rm -rf "$test_dir"
  printf 'exit=%s; owned processes stopped; scenario storage removed\n' "$result" > "$log_dir/cleanup.txt"
  echo "E2E diagnostics: $log_dir (exit $result)"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# Fail before starting services; never kill a process that already owns a port.
python3 scripts/e2e-ports.py
ready() {
  local deadline=$((SECONDS + 30))
  while ((SECONDS < deadline)); do
    kill -0 "$2" 2>/dev/null || { cat "$log_dir"/*.log >&2; return 1; }
    if curl --connect-timeout 1 --max-time 1 -fsS "$1" >/dev/null 2>&1; then return 0; fi
    sleep 0.2
  done
  echo "Readiness timed out: $1" >&2
  cat "$log_dir"/*.log >&2
  return 1
}
database_path=$(native_path "$test_dir/projects.db")
export ConnectionStrings__Projects="Data Source=$database_path;Pooling=False"
printf 'commit=%s\nstorage=%s\n' "$(git rev-parse HEAD)" "$test_dir" > "$log_dir/scenario.txt"
start_api() {
  dotnet .artifacts/build/api/output/ProjectManager.Api.dll --urls http://127.0.0.1:5001 >>"$log_dir/api.log" 2>&1 &
  api_pid=$!
  pids+=("$api_pid")
  ready http://127.0.0.1:5001/api/health "$api_pid"
}
start_api
API_URL=http://127.0.0.1:5001 node src/web/node_modules/vite/bin/vite.js preview src/web \
  --outDir "$ROOT/.artifacts/build/web/output" --host 127.0.0.1 --port 5174 --strictPort >"$log_dir/web.log" 2>&1 &
web_pid=$!
pids+=("$web_pid")
ready http://127.0.0.1:5174/api/health "$web_pid"
curl --max-time 2 -fsS http://127.0.0.1:5174/api/health > "$log_dir/proxy-health.json"
python3 -c 'import json,sys; assert json.load(open(sys.argv[1])) == {"status":"ok"}' "$log_dir/proxy-health.json"
E2E_PHASE=create npm --prefix src/web run e2e
python3 scripts/report.py e2e-create
kill "$api_pid"
wait "$api_pid" || true
pids=("$web_pid")
start_api
E2E_PHASE=restart npm --prefix src/web run e2e
python3 scripts/report.py e2e-restart
