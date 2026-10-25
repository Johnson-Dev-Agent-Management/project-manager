#!/usr/bin/env bash
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
npm --prefix src/web run build
dotnet build tests/ProjectManager.Api.Tests --no-restore
