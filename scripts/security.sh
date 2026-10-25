#!/usr/bin/env bash
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
mkdir -p .artifacts/security
python3 scripts/install-policy-tools.py
export PATH="$PROJECT_TOOLS_DIR/policy:$PATH"
date -u +%FT%TZ > .artifacts/security/checked-at.txt
# Collect npm JSON even on failure, then propagate the audit exit status.
audit_status=0
npm --prefix src/web audit --json --audit-level=high > .artifacts/security/npm-audit.json || audit_status=$?
# Force fresh NuGet advisory access. Warnings (including NU1900) are errors.
dotnet restore tests/ProjectManager.Api.Tests --locked-mode --force --no-http-cache \
  2>&1 | tee .artifacts/security/nuget-restore.log
dotnet list tests/ProjectManager.Api.Tests package --vulnerable --include-transitive --format json --no-restore \
  > .artifacts/security/nuget-audit.json
python3 scripts/security-report.py
[[ $audit_status == 0 ]] || exit "$audit_status"
gitleaks git --redact=100 --log-opts=--all --report-format=json --report-path=.artifacts/security/gitleaks-history.json
# Scan tracked working-tree files too, without dependency/cache/generated directories.
scan_dir=$(mktemp -d)
trap 'rm -rf "$scan_dir"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
git ls-files -z | tar --null -T - -cf - | tar -xf - -C "$scan_dir"
gitleaks dir "$scan_dir" --redact=100 --report-format=json --report-path="$ROOT/.artifacts/security/gitleaks-working-tree.json"
printf 'Passed: npm/NuGet advisory retrieval and blocking floors; redacted history and tracked-tree scans\n' \
  | tee .artifacts/security/result.txt
