# project-manager

Project management app built with React, strict TypeScript, Vite, ASP.NET Core,
EF Core, and SQLite. The interface creates/lists projects; the server trims names
and rejects blank names with useful validation errors. Data is synthetic.
Authentication, shared access, deployments, and production migrations are future work.

## Setup and development

Use Node **26.13.0 LTS**, npm **12.2.1**, and .NET SDK **10.0.402**, pinned in `.nvmrc`,
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
`dotnet restore tests/ProjectManager.Api.Tests --locked-mode`. Setup installs
Node/npm in a versioned directory under ignored `.tools` when host versions differ,
including on Windows Git Bash. This also works with newer bootstrap host tools.
The bootstrap selects the platform's prebuilt binary package with install scripts
disabled, avoiding npm's Windows node-wrapper launcher issue.
Versioned directories avoid replacing a running Windows executable during upgrades.
Cache overrides and prepared
cloud reuse are documented in [CI operation](docs/ci.md). No personal credentials
are required. Do not modify lockfiles except for intentional reviewed updates.

Git enforces LF text checkouts (including scripts and version pins), even with
Windows `core.autocrlf=true`.

Development starts the API on **http://127.0.0.1:5000** and Vite on
**http://127.0.0.1:5173**, with `/api` proxying. SQLite persists in ignored
`.data/projects.db`. Set `PROJECT_DEV_DATA_DIR` to use a different directory,
including a Windows path with spaces. Occupied ports fail before startup; Ctrl+C
stops owned processes with bounded cleanup. `bash scripts/dev-smoke.sh` verifies
startup, the API proxy, synthetic create/list, and shutdown using temporary storage.
Services retain their five-second shutdown grace. The smoke supervisor allows ten
seconds for `dev.sh` to finish child cleanup and requires its acknowledgment before
deleting temporary storage; missing acknowledgment fails the run and preserves it.
Both development scripts accept `PROJECT_DEV_API_PORT` and `PROJECT_DEV_WEB_PORT`
to override the default ports; values must be distinct integers from 1 to 65535.
The selected API port also configures Vite's proxy. Occupied selected ports still
fail before startup. Cleanup regression tests allocate their own ports, so
`check.sh` (including `check.sh frontend`) can run while the normal app is running.
To check readiness with the defaults:

```bash
curl -fsS http://127.0.0.1:5000/api/health
curl -fsS http://127.0.0.1:5173/api/projects
```

Startup creates a fresh schema; it does not upgrade an existing SQLite database.
For schema-changing features, follow [development database guidance](docs/engineering.md#development-database-schema-changes)
and document the data-preservation or disposable-data reset strategy.

Native Windows uses **Git Bash**, bootstrap Node/npm, the pinned native .NET SDK
on PATH, Python 3, and curl. Use the same setup/check/dev commands; setup selects
the project Node/npm tools automatically. It reports missing .NET SDKs instead of
running a Unix SDK installer. Native cache paths and `cygpath -am` SQLite paths
(including spaces) are preserved. Hosted Windows tests a fresh workspace Node/npm
bootstrap in a path with spaces, repeated setup, `bash scripts/build.sh`, and the full
`bash scripts/check.sh` suite, including Python setup regressions. It also runs
development-server smoke checks and `bash scripts/e2e.sh`, covering production
builds and both browser persistence phases with matched Chromium.
`PROJECT_BOOTSTRAP_NODE=true bash scripts/setup.sh` explicitly installs workspace
tools even when host versions match. `PROJECT_NODE_DIR` can select an isolated
tool directory; use the same override for subsequent project commands.
`policy.sh` and `security.sh` require Linux x64 and report that requirement before
downloading tools on Windows. Use their required hosted CI jobs for those checks.
Linux retains ten-run browser qualification; Windows runs one full browser scenario.
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
[CI commands and validation matrix](docs/ci.md#local-and-hosted-validation), and the
[PR template](.github/pull_request_template.md) for routine work. The completed
[Milestone 0 plan](docs/milestones/milestone-0.md) provides historical context.
`check.sh` runs lint, complete authored TypeScript/config checking, frontend build,
Vitest V8 coverage, .NET build, xUnit/SQLite/Coverlet, report integrity checks, and
Python attribution/policy regression tests. Its shell cleanup regressions require
Perl (included in Git for Windows and the hosted Linux runners) to exercise
services that ignore SIGTERM on both platforms. `policy.sh` runs Prettier, .NET format,
ShellCheck, actionlint, and policy tests. `security.sh` runs fresh npm/NuGet advisory
checks and redacted Gitleaks scans. Unavailable advisory data is a failing result.

Each production codebase independently enforces **80% lines / 70% branches** after
baseline review and behavioral test improvements. Untested production files remain
included. Standards, tests, thresholds, workflows, and exceptions require
independent human review. Milestone 0 is complete for supervised development; its implementation is approved and merged;
all seven required jobs pass on the resulting main commit. CODEOWNERS names
Joshbomb75 for all files. Ten exact historical artifact-hash exclusions are active,
with review due **November 9, 2026 at 4 p.m. Pacific**, tracked in
[issue #17](https://github.com/Johnson-Dev-Agent-Management/project-manager/issues/17).
The owner-provided protection export confirms required reviews and up-to-date
checks; full credential isolation remains deferred. See the [current closeout report](docs/milestones/milestone-0-closeout-report.md)
for verified controls, remaining evidence and the exception register.

```bash
# Build frontend production output and publish Release API, then test both phases:
bash scripts/e2e.sh
# CI always qualifies ten runs; also use locally for harness/reliability changes:
bash scripts/e2e-qualify.sh
```

E2E owns loopback ports 5001/5174, rejects occupied ports, verifies the build/proxy,
and tests validation, trimming, create/reload, and API restart persistence.
It cleans up its processes/database and retains each run's diagnostics/screenshots
under ignored `.artifacts`. CI uses matched Chromium; restricted cloud runs report
any system Chromium fallback explicitly. There are no browser retries.

Record each task's commands/results, current CI links, and handoff state in its PR.
Update this README for durable setup/usage changes rather than per-task test logs.
Historical M0 commands, counts, coverage, tested commits, security results,
screenshots, CI links, and risks are in the
[M0 closeout report](docs/milestones/milestone-0-closeout-report.md).
[Phase A](docs/milestones/milestone-0-phase-a-report.md) and
[Phase B](docs/milestones/milestone-0-phase-b-report.md) reports are historical snapshots.
See [cloud setup](docs/cloud-setup.md) for historical environment context.

## Pull request attribution

Use the [PR template](.github/pull_request_template.md) and distinguish Passed,
Failed, and Not run checks. AI implementations include exactly one standalone
`Implementation type: AI` field and `Implementation author: Codex Cloud` (or the
actual agent), plus the `AI-authored` label. See [attribution](docs/pr-attribution.md)
for metadata-only labeling and its limits. Attribution does not establish
independent approval. Owner merging remains separate; the Apache license is unchanged.
