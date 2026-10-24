# project-manager
Full-stack project management app built with React, TypeScript, C#, and ASP.NET Core, developed using autonomous AI coding agents.

## Cloud development baseline

Creating and listing projects is implemented in React/strict TypeScript/Vite and
ASP.NET Core with EF Core SQLite. Names are trimmed; blank names produce HTTP 400
validation responses. The UI includes labeled controls and loading, empty, and
error states. Development data is synthetic and retained in ignored `.data/projects.db`.
The Apache license is unchanged. Authentication and deployment remain future work.

Target Node **24.22.0** is pinned in `.nvmrc`; the official
[Node.js changelog](https://github.com/nodejs/node/blob/v24.22.0/doc/changelogs/CHANGELOG_V24.md#24.22.0)
identifies it as the October 14, 2026 **Krypton LTS** release.

Tested in Codex Cloud: Node **24.22.0**, npm **11.9.0**, .NET SDK **10.0.402**,
React **19.3.0**, TypeScript **6.0.3**, Vite **8.3.3**, EF Core **10.0.9**,
SQLitePCLRaw bundle **3.0.5**, Playwright **1.64.0** and system Chromium
**151.0.7922.173**. Exact npm versions and integrity hashes are in package-lock.json;
NuGet versions/content hashes are in both packages.lock.json files.

From the repository root:

```bash
bash scripts/setup.sh
bash scripts/check.sh
bash scripts/dev.sh
# Run separately; owns isolated ports, processes and a temporary database:
bash scripts/e2e.sh
```

Setup reads exact Node, npm, and .NET SDK versions from `.nvmrc`, `.npm-version`,
and `global.json`. It restores with `npm --prefix src/web ci` and
`dotnet restore tests/ProjectManager.Api.Tests --locked-mode`. On Linux/macOS,
missing tools install under ignored checkout-local `.tools/`; writable caches
are selected by `scripts/common.sh`, with prepared cloud cache reuse when available.
Windows uses installed tools on PATH and preserves native cache paths.
See [CI commands and policy](docs/ci.md) for hosted runner behavior, cache overrides,
coverage scope, report validation, and exact command groups.

Check runs npm lint, typecheck, build and coverage tests, then `dotnet build` and
`dotnet test` with coverage for the backend test project, plus Python attribution
and CI evidence tests. Coverage is informational without new thresholds. Dev builds and starts the API DLL on
loopback port 5000 and Vite on loopback port 5173. Vite proxies `/api` to the API.
Check readiness with `curl -fsS http://127.0.0.1:5000/api/health` (status `ok`)
and `curl -fsS http://127.0.0.1:5173/api/projects` (JSON array). Ctrl+C cleans up
both processes. No public preview or production secrets are required.

## Local development

For your own local checkout, install Git, Bash, .NET SDK **10.0.402**, and
[nvm](https://github.com/nvm-sh/nvm) on Linux/macOS or WSL.
From the repository root, select the same Node version as the cloud environment:

```bash
nvm install
nvm use
node --version # v24.22.0
npm --prefix src/web ci
dotnet restore tests/ProjectManager.Api.Tests --locked-mode
mkdir -p .data
```

For **native Windows with Git Bash**, install Node.js **24.22.0** and the
**Windows .NET SDK 10.0.402** and npm **11.9.0**, then reopen Git Bash and run:

```bash
node --version   # v24.22.0
dotnet --version # 10.0.402
bash scripts/setup.sh
bash scripts/check.sh
bash scripts/dev.sh
```

On Windows, setup uses tools on PATH and preserves your normal cache locations.
If Node or the pinned .NET SDK is missing, it exits with install instructions;
it does not run the Unix .NET installer. The .NET version comes from `global.json`.
Linux/cloud automatic installation uses checkout-relative tool storage.
The development and E2E scripts convert database filenames to Windows paths
before passing them to SQLite, including paths containing spaces.

For local startup, use the underlying commands below. In one terminal, from the
repository root:

```bash
database_path=$(node -p 'require("node:path").resolve(".data/projects.db")')
ConnectionStrings__Projects="Data Source=$database_path" \
  dotnet run --project src/api/ProjectManager.Api --no-launch-profile \
  --urls http://127.0.0.1:5000
```

In a second terminal, from the repository root:

```bash
npm --prefix src/web run dev -- --port 5173 --strictPort
```

Open **http://127.0.0.1:5173**. Stop each process with Ctrl+C. The UI proxies
`/api` to port 5000; projects persist in the checkout's ignored `.data/projects.db`.
Setup requires npm **11.9.0**, as recorded in `.npm-version`;
`npm ci` uses the committed lockfile without upgrading application dependencies.

## Phase A validation

`bash scripts/setup.sh` and `bash scripts/check.sh` passed in the cloud with
Node 24.22.0, npm 11.9.0, SDK 10.0.402, 3 frontend tests, 4 backend integration
cases, 8 existing attribution tests, and 4 CI evidence tests. `bash scripts/e2e.sh`
passed both browser phases using the reported system Chromium fallback.
Measured frontend coverage: **96% lines, 75% branches**; backend: **100% lines,
75% branches**. Neither codebase has a new coverage threshold.

Hosted run results, the tested commit, controlled failure evidence, and remaining
acceptance items are recorded in the [Phase A report](docs/milestones/milestone-0-phase-a-report.md).
See [CI operations](docs/ci.md) for commands, protected-policy changes, artifact
scope, and limitations. Phase A does not establish branch enforcement.

## Historical verified results

With Node **24.22.0** and .NET SDK **10.0.402**, `bash scripts/setup.sh`
installed the pinned SDK and restored locked dependencies successfully.
`bash scripts/check.sh` passed
lint, strict typecheck, frontend/backend builds and all **3 frontend tests** and
**4 backend tests**; the backend build had zero warnings and errors.
Backend tests cover trimming, blank/null rejection, listing and database persistence
across application restart. Frontend tests cover creation, validation and load failure.

`bash scripts/e2e.sh` passed **two browser phases** of the same persistence scenario:
creation, server validation and page reload; then a fresh browser request after
stopping/restarting the API against the same temporary SQLite database. E2E uses
ports 5001/5174 and deletes its database and stops its services on exit.
Both phases used preinstalled system Chromium **151.0.7922.173**. A new shell
sourcing `scripts/common.sh` selected Node **24.22.0**, and all application
dependency manifests and lockfiles remained unchanged. Validation reused the
existing dependency caches; it did not republish the saved
cloud environment or verify a fresh session from a new image.

Development startup was checked with `bash scripts/dev.sh`: the API health check
and Vite-proxied project listing passed, SQLite created `.data/projects.db`, and
both services stopped on exit. Simulated Windows runs of dev/E2E verified native
database paths containing spaces and safe exits on conversion failures; Linux
paths were preserved.

Simulated Git Bash/MSYS/Cygwin cases verified missing, mismatched, and runtime-only
.NET installations; a matching SDK; and missing/mismatched Node versions. Missing
prerequisites stopped before installation or restore, with Windows instructions.
The matching SDK case preserved PATH/cache settings and completed restore. These
checks ran in the cloud with command stubs; native Windows server startup and
browser E2E remain unverified.

See [cloud setup](docs/cloud-setup.md) for environment controls and remaining steps.

## Pull request attribution

Use the [PR template](.github/pull_request_template.md) to name the implementation
author and report passed, failed, and unrun checks. AI implementations use
`Implementation type: AI` plus the actual agent name, normally `Codex Cloud`;
manual implementations use `Human`. See [attribution setup](docs/pr-attribution.md)
for automatic `AI-authored` labeling, manual fallback, and its security boundaries.

Attribution validation used Python **3.12.14**:
`python3 -B -m unittest discover -s tests -p 'test_pr_attribution.py' -v`
passed all **8 tests** against the workflow script with a mocked GitHub API.
YAML parsing and checks of workflow triggers, permissions, and script isolation
also passed. Live GitHub Actions execution remains unverified until merge.

During this change, `bash scripts/setup.sh` restored dependencies and
`bash scripts/check.sh` passed npm lint/typecheck/build/test (3 frontend tests),
`dotnet build tests/ProjectManager.Api.Tests --no-restore`, and
`dotnet test tests/ProjectManager.Api.Tests --no-build --no-restore` (4 backend tests).
`bash scripts/e2e.sh` passed both browser persistence phases using the Node, npm,
.NET SDK, and Chromium versions recorded above. Initial check/E2E attempts failed
because dependencies were absent or sandbox sockets were denied; after setup and
granting per-command network access for loopback tests, both commands passed.
