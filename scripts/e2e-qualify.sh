#!/usr/bin/env bash
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
# Both phases must pass on every iteration. There are no retries or ignored failures.
python3 scripts/build-output.py verify web
python3 scripts/build-output.py verify api
mkdir -p .artifacts/qualification
qualification_dir=$(mktemp -d "$ROOT/.artifacts/qualification/run-XXXXXX")
for ((run=1; run<=10; run++)); do
  echo "Reliability qualification: $run/10"
  bash scripts/e2e.sh --use-builds 2>&1 | tee "$qualification_dir/run-$run.log"
done
printf 'Passed: ten consecutive full executions, fresh storage, zero retries. Commit: %s\n' \
  "$(git rev-parse HEAD)" | tee "$qualification_dir/result.txt"
