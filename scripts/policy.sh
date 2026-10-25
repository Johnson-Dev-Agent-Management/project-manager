#!/usr/bin/env bash
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
mkdir -p .artifacts/policy
python3 scripts/install-policy-tools.py
export PATH="$PROJECT_TOOLS_DIR/policy:$PATH"
# Run from the root so repository formatting ignores/config apply consistently.
node src/web/node_modules/prettier/bin/prettier.cjs --check .
dotnet format src/api/ProjectManager.Api --verify-no-changes --no-restore --severity info
dotnet format tests/ProjectManager.Api.Tests --verify-no-changes --no-restore --severity info
shellcheck --external-sources --source-path=SCRIPTDIR scripts/*.sh
actionlint -color
python3 -B scripts/python-tests.py
