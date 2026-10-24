#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
frontend() {
  rm -rf .artifacts/frontend
  npm --prefix src/web run lint
  npm --prefix src/web run typecheck
  npm --prefix src/web run build
  npm --prefix src/web run test:coverage
  python3 scripts/report.py frontend
}
backend() {
  rm -rf .artifacts/backend
  dotnet build tests/ProjectManager.Api.Tests --no-restore
  dotnet test tests/ProjectManager.Api.Tests --no-build --no-restore \
    --collect:"XPlat Code Coverage" --settings tests/coverage.runsettings \
    --logger "trx;LogFileName=tests.trx" --results-directory "$ROOT/.artifacts/backend"
  python3 scripts/report.py backend
}
attribution() {
  mkdir -p .artifacts/attribution
  python3 -B scripts/python-tests.py \
    2>&1 | tee .artifacts/attribution/tests.txt
}
case "${1:-all}" in
  all) frontend; backend; attribution ;;
  frontend) frontend; attribution ;;
  backend) backend ;;
  *) echo "Usage: bash scripts/check.sh [all|frontend|backend]" >&2; exit 2 ;;
esac
