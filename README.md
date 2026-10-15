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

From `/workspace/project-manager`:

```bash
bash scripts/setup.sh
bash scripts/check.sh
bash scripts/dev.sh
# Run separately; owns isolated ports, processes and a temporary database:
bash scripts/e2e.sh
```

Setup reads the exact Node version from `.nvmrc`. If the cloud image has a
different version, setup installs the pinned runtime into `/workspace/.node`
using npm's `node` package from `registry.npmjs.org`. All root-level scripts
activate that runtime through `scripts/common.sh`; npm itself is unchanged.
Setup also verifies the pinned SDK, installs it into `/workspace/.dotnet`
if absent, and runs `npm --prefix src/web ci` and
`dotnet restore tests/ProjectManager.Api.Tests --locked-mode`. Cloud-local caches
and tool activation are defined by `scripts/common.sh`; setup is safe to rerun.
The cloud image supplies bootstrap Node/npm and Chromium. On another image,
provide bootstrap Node/npm and Chromium before setup/E2E; E2E uses `chromium` from PATH
or `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, otherwise Playwright's installed browser.

Check runs npm lint, typecheck, build and test, then `dotnet build` and
`dotnet test` for the backend test project. Dev builds and starts the API DLL on
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
**Windows .NET SDK 10.0.402**, then reopen Git Bash and run:

```bash
node --version   # v24.22.0
dotnet --version # 10.0.402
bash scripts/setup.sh
```

On Windows, setup uses tools on PATH and preserves your normal cache locations.
If Node or the pinned .NET SDK is missing, it exits with install instructions;
it does not run the Unix .NET installer. The .NET version comes from `global.json`.
Cloud automatic installation is unchanged.

For local startup, use the underlying commands below. In one terminal, from the
repository root:

```bash
ConnectionStrings__Projects="Data Source=$PWD/.data/projects.db" \
  dotnet run --project src/api/ProjectManager.Api --no-launch-profile \
  --urls http://127.0.0.1:5000
```

In a second terminal, from the repository root:

```bash
npm --prefix src/web run dev -- --port 5173 --strictPort
```

Open **http://127.0.0.1:5173**. Stop each process with Ctrl+C. The UI proxies
`/api` to port 5000; projects persist in the checkout's ignored `.data/projects.db`.
Local npm may differ from the tested cloud npm **11.9.0**;
`npm ci` uses the committed lockfile without upgrading application dependencies.

## Verified results

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

Simulated Git Bash/MSYS/Cygwin cases verified missing, mismatched, and runtime-only
.NET installations; a matching SDK; and missing/mismatched Node versions. Missing
prerequisites stopped before installation or restore, with Windows instructions.
The matching SDK case preserved PATH/cache settings and completed restore. These
checks ran in the cloud with command stubs; native Windows execution remains unverified.

See [cloud setup](docs/cloud-setup.md) for environment controls and remaining steps.
