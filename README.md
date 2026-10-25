# project-manager

Project management app built with React, strict TypeScript, Vite, ASP.NET Core,
EF Core, and SQLite. The interface creates/lists projects; the server trims names
and rejects blank names with useful validation errors. Data is synthetic.
Authentication, shared access, deployments, and production migrations are future work.

## Setup and development

Use Node **24.22.0**, npm **11.9.0**, and .NET SDK **10.0.402**, pinned in `.nvmrc`,
`.npm-version`, and `global.json`. Dependencies and hashes are locked in npm and
NuGet lockfiles. Core versions remain React 19.3.0, TypeScript 6.0.3, Vite 8.3.3,
EF Core 10.0.9, SQLitePCLRaw 3.0.5, and Playwright 1.64.0.

From any authorized cloud checkout with Bash, Python 3, curl, and bootstrap npm:

```bash
bash scripts/setup.sh
bash scripts/check.sh
bash scripts/policy.sh
bash scripts/security.sh
bash scripts/dev.sh
```

Setup selects exact tools, runs `npm --prefix src/web ci` and
`dotnet restore tests/ProjectManager.Api.Tests --locked-mode`. Linux/macOS can
install missing runtimes under ignored `.tools`; cache overrides and prepared
cloud reuse are documented in [CI operation](docs/ci.md). No personal credentials
are required. Do not modify lockfiles except for intentional reviewed updates.

Development starts the API on **http://127.0.0.1:5000** and Vite on
**http://127.0.0.1:5173**, with `/api` proxying. SQLite persists in ignored
`.data/projects.db`. Ctrl+C stops owned processes. To check readiness:

```bash
curl -fsS http://127.0.0.1:5000/api/health
curl -fsS http://127.0.0.1:5173/api/projects
```

Native Windows uses **Git Bash**, Windows Node/npm/.NET at the exact versions on
PATH, Python 3, and curl. Reopen Git Bash after installing tools, then use the same
setup/check/dev commands. Setup reports missing tools instead of running Unix
installers. Native cache paths and `cygpath -am` SQLite paths (including spaces)
are preserved. Hosted Windows runs setup twice and `bash scripts/build.sh`.
Linux x64 is the full policy/security/browser validation platform; policy-tool
installation and Windows browser execution are not part of the Windows smoke job.
Agent execution remains in the cloud, never on the owner's personal computer.

Underlying development commands, in separate terminals from the repository root:

```bash
database_path=$(node -p 'require("node:path").resolve(".data/projects.db")')
ConnectionStrings__Projects="Data Source=$database_path" \
  dotnet run --project src/api/ProjectManager.Api --no-launch-profile \
  --urls http://127.0.0.1:5000
```

```bash
npm --prefix src/web run dev -- --port 5173 --strictPort
```

## Validation and engineering standards

Read [AGENTS.md](AGENTS.md), [engineering standards](docs/engineering.md),
[CI commands](docs/ci.md), and the [Milestone 0 plan](docs/milestones/milestone-0.md).
`check.sh` runs lint, complete authored TypeScript/config checking, frontend build,
Vitest V8 coverage, .NET build, xUnit/SQLite/Coverlet, report integrity checks, and
Python attribution/policy regression tests. `policy.sh` runs Prettier, .NET format,
ShellCheck, actionlint, and policy tests. `security.sh` runs fresh npm/NuGet advisory
checks and redacted Gitleaks scans. Unavailable advisory data is a failing result.

Each production codebase independently enforces **80% lines / 70% branches** after
baseline review and behavioral test improvements. Untested production files remain
included. Standards, tests, thresholds, workflows, and exceptions require
independent human review. There are no operative exceptions. Phase C enforcement
and independent identity separation are not established by passing checks.

```bash
# Build frontend production output and publish Release API, then test both phases:
bash scripts/e2e.sh
# Reuse verified output from this commit; ten full runs with fresh SQLite each time:
bash scripts/e2e-qualify.sh
```

E2E owns loopback ports 5001/5174, rejects occupied ports, verifies the build/proxy,
and tests validation, trimming, create/reload, and API restart persistence.
It cleans up its processes/database and retains each run's diagnostics/screenshots
under ignored `.artifacts`. CI uses matched Chromium; restricted cloud runs report
any system Chromium fallback explicitly. There are no browser retries.

Actual commands, counts, coverage before/after, tested commits, security results,
screenshots, CI links, and unresolved risks are in the
[Phase B acceptance report](docs/milestones/milestone-0-phase-b-report.md).
[Phase A evidence](docs/milestones/milestone-0-phase-a-report.md) is historical.
See [cloud setup](docs/cloud-setup.md) for historical environment context.

## Pull request attribution

Use the [PR template](.github/pull_request_template.md) and distinguish Passed,
Failed, and Not run checks. AI implementations include exactly one standalone
`Implementation type: AI` field and `Implementation author: Codex Cloud` (or the
actual agent), plus the `AI-authored` label. See [attribution](docs/pr-attribution.md)
for metadata-only labeling and its limits. Attribution does not establish
independent approval. Owner merging remains separate; the Apache license is unchanged.
