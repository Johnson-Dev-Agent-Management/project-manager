#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
npm --prefix src/web run lint
npm --prefix src/web run typecheck
npm --prefix src/web run build
npm --prefix src/web test
dotnet build tests/ProjectManager.Api.Tests --no-restore
dotnet test tests/ProjectManager.Api.Tests --no-build --no-restore
