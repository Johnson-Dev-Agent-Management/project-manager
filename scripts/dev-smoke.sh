#!/usr/bin/env bash
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
# Isolated synthetic storage; never touch the normal development database.
python3 scripts/e2e-ports.py 5000 5173
mkdir -p .artifacts/dev-smoke
log_dir=$(mktemp -d "$ROOT/.artifacts/dev-smoke/run-XXXXXX")
test_dir=$(mktemp -d "${TMPDIR:-/tmp}/project dev-XXXXXX")
dev_pid=
dev_started=false
stop_dev() {
  # dev.sh needs its full five-second service grace, then SIGKILL and wait.
  # Give the supervisor a separate ten-second budget on both shutdown paths.
  stop_processes_with_grace 10 "$dev_pid"
  dev_pid=
  [[ -f $test_dir/cleanup-complete ]]
}
cleanup() {
  result=$?
  trap - EXIT INT TERM
  if [[ -n $dev_pid ]]; then stop_dev || result=1; fi
  if [[ $dev_started == false || -f $test_dir/cleanup-complete ]]; then
    rm -rf "$test_dir"
  else
    echo "Development cleanup was not acknowledged; retaining storage: $test_dir" >&2
    result=1
  fi
  echo "Development smoke diagnostics: $log_dir (exit $result)"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
PROJECT_DEV_DATA_DIR="$test_dir" PROJECT_DEV_CLEANUP_FILE="$test_dir/cleanup-complete" \
  bash scripts/dev.sh > "$log_dir/services.log" 2>&1 &
dev_pid=$!
dev_started=true
deadline=$((SECONDS + 60))
until curl --connect-timeout 1 --max-time 1 -fsS http://127.0.0.1:5173/api/health > "$log_dir/health.json" 2>/dev/null; do
  if ! kill -0 "$dev_pid" 2>/dev/null || ((SECONDS >= deadline)); then
    cat "$log_dir/services.log" >&2
    exit 1
  fi
  sleep 0.2
done
python3 - <<'PY'
import json
from urllib.request import Request, urlopen

base = 'http://127.0.0.1:5173/api'
with urlopen(base + '/health', timeout=5) as response:
    assert json.load(response) == {'status': 'ok'}
with urlopen(base + '/projects', timeout=5) as response:
    assert json.load(response) == []
request = Request(base + '/projects', data=b'{"name":"  Development smoke  "}',
                  headers={'Content-Type': 'application/json'})
with urlopen(request, timeout=5) as response:
    assert response.status == 201
    project = json.load(response)
    assert project['name'] == 'Development smoke'
with urlopen(base + '/projects', timeout=5) as response:
    assert json.load(response) == [project]
PY
[[ -f $test_dir/projects.db ]]
stop_dev
# No development listeners may survive shell shutdown.
python3 scripts/e2e-ports.py 5000 5173
printf 'Passed: dev startup, proxy, create/list, spaced database path, and shutdown\n' | tee "$log_dir/result.txt"
