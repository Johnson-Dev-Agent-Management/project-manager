#!/usr/bin/env bash
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
# Isolated synthetic storage; never touch the normal development database.
python3 scripts/e2e-ports.py 5000 5173
mkdir -p .artifacts/dev-smoke
log_dir=$(mktemp -d "$ROOT/.artifacts/dev-smoke/run-XXXXXX")
test_dir=$(mktemp -d "${TMPDIR:-/tmp}/project dev-XXXXXX")
dev_pid=
cleanup() {
  result=$?
  trap - EXIT INT TERM
  if [[ -n $dev_pid ]]; then stop_processes "$dev_pid"; fi
  rm -rf "$test_dir"
  echo "Development smoke diagnostics: $log_dir (exit $result)"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
PROJECT_DEV_DATA_DIR="$test_dir" bash scripts/dev.sh > "$log_dir/services.log" 2>&1 &
dev_pid=$!
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
stop_processes "$dev_pid"
dev_pid=
# No development listeners may survive shell shutdown.
python3 scripts/e2e-ports.py 5000 5173
printf 'Passed: dev startup, proxy, create/list, spaced database path, and shutdown\n' | tee "$log_dir/result.txt"
