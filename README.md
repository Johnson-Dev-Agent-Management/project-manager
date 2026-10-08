# project-manager
Full-stack project management app built with React, TypeScript, C#, and ASP.NET Core, developed using autonomous AI coding agents.

## Cloud development baseline

Creating and listing projects is implemented in React/strict TypeScript/Vite and
ASP.NET Core with EF Core SQLite. Names are trimmed; blank names produce HTTP 400
validation responses. The UI includes labeled controls and loading, empty, and
error states. Development data is synthetic and retained in ignored `.data/projects.db`.
The Apache license is unchanged. Authentication and deployment remain future work.

Tested in Codex Cloud: Node **24.19.0**, npm **11.9.0**, .NET SDK **10.0.401**,
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

Setup verifies Node and the pinned SDK, installs the SDK into `/workspace/.dotnet`
if absent, runs `npm --prefix src/web ci` and
`dotnet restore tests/ProjectManager.Api.Tests --locked-mode`. Cloud-local caches
and tool activation are defined by `scripts/common.sh`; setup is safe to rerun.
Node and Chromium are supplied by the tested cloud image. On another image,
provide Node 24.19.0 and Chromium before setup/E2E; E2E uses `chromium` from PATH
or `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, otherwise Playwright's installed browser.

Check runs npm lint, typecheck, build and test, then `dotnet build` and
`dotnet test` for the backend test project. Dev builds and starts the API DLL on
loopback port 5000 and Vite on loopback port 5173. Vite proxies `/api` to the API.
Check readiness with `curl -fsS http://127.0.0.1:5000/api/health` (status `ok`)
and `curl -fsS http://127.0.0.1:5173/api/projects` (JSON array). Ctrl+C cleans up
both processes. No public preview or production secrets are required.

## Verified results

In this cloud instance, locked setup passed and was rerun successfully. Lint,
strict typecheck, frontend/backend builds passed; the final backend build had
zero warnings and errors. All **3 frontend tests** and **4 backend tests** passed.
Backend tests cover trimming, blank/null rejection, listing and database persistence
across application restart. Frontend tests cover creation, validation and load failure.

`bash scripts/e2e.sh` passed **two browser phases** of the same persistence scenario:
creation, server validation and page reload; then a fresh browser request after
stopping/restarting the API against the same temporary SQLite database. E2E uses
ports 5001/5174 and deletes its database and stops its services on exit.
Playwright's managed Chromium download was denied by network policy; the actual
browser scenario passed using preinstalled system Chromium. This was browser E2E,
not an API-only substitute. Development startup, HTML serving, health and proxied
project listing were also checked. The published environment was verified in a fresh cloud task: locked setup,
all checks and both browser phases passed; services stopped cleanly. The fresh
task used the published image and caches, rather than a cache-empty bootstrap.

See [cloud setup](docs/cloud-setup.md) for environment controls and remaining steps.
