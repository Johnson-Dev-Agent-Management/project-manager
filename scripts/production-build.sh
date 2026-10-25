#!/usr/bin/env bash
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
case "${1:-all}" in
  web)
    npm --prefix src/web run build
    rm -rf .artifacts/build/web
    mkdir -p .artifacts/build/web
    cp -R src/web/dist .artifacts/build/web/output
    python3 scripts/build-output.py record web
    ;;
  api)
    rm -rf .artifacts/build/api
    dotnet publish src/api/ProjectManager.Api -c Release --no-restore -o "$ROOT/.artifacts/build/api/output"
    python3 scripts/build-output.py record api
    ;;
  all)
    bash scripts/production-build.sh web
    bash scripts/production-build.sh api
    ;;
  *) echo 'Usage: production-build.sh [all|web|api]' >&2; exit 2 ;;
esac
