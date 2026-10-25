# CI operation — Milestone 0, Phase B

Run in an authorized cloud checkout. Exact Node 24.22.0, npm 11.9.0, and
.NET SDK 10.0.402 remain pinned. Setup uses npm ci and locked NuGet restore;
Linux/macOS may install runtimes under ignored `.tools`. Native Windows uses
Git Bash and pinned tools on PATH; `cygpath -am` database conversion is preserved.
There is no required `/workspace` location or dependency on personal credentials.

```bash
bash scripts/setup.sh
bash scripts/check.sh
bash scripts/policy.sh
bash scripts/security.sh
bash scripts/e2e.sh
# Qualification using output produced above; ten full executions, no retries:
bash scripts/e2e-qualify.sh
```

| Entry point                      | Underlying checks                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check.sh frontend`              | npm lint, typecheck, build, test:coverage; report integrity/floors; Python attribution/policy regression tests                                          |
| `check.sh backend`               | dotnet build and test --no-build --no-restore, xUnit, real SQLite, TRX/Coverlet, report integrity/floors                                                |
| `check.sh`                       | Both groups and Python tests                                                                                                                            |
| `policy.sh`                      | Prettier --check, dotnet format --verify-no-changes --no-restore --severity info for both projects, ShellCheck, actionlint, Python tests                |
| `security.sh`                    | npm audit, forced uncached locked NuGet restore and transitive vulnerability JSON, fail-closed parser, redacted Gitleaks history and tracked-tree scans |
| `build.sh`                       | Existing frontend/backend/test-project Windows-compatible build smoke                                                                                   |
| `production-build.sh [web\|api]` | Vite build or dotnet publish -c Release --no-restore; output/provenance under .artifacts/build                                                          |
| `e2e.sh [--use-builds]`          | Default builds production output; optional flag consumes verified existing output; both browser phases and cleanup                                      |
| `e2e-qualify.sh`                 | Ten consecutive full executions of e2e.sh --use-builds, fresh scenario database each time; abort at first failure                                       |

[Engineering standards](engineering.md) specifies contracts, behavioral mapping,
80% line / 70% branch floors per codebase, coverage scope, security triage, exact
analysis policy, and the empty exception register. The [Phase A report](milestones/milestone-0-phase-a-report.md)
is historical evidence; Phase B report records current outcomes.

## Workflows and production browser testing

`Foundational CI` retains every PR to main (including drafts), push to main,
and manual dispatch with `cold-cache`. No path filters. Stable check names:
**frontend**, **backend**, **windows-smoke**, **e2e**, **policy**, **supply-chain**,
and **quality-gate**. E2E depends on frontend/backend. The always-running aggregate
gate accepts only explicit success from all six dependencies, rejecting missing,
failed, skipped, and cancelled jobs. Python tests exercise each dependency's
failure outcomes. These names are not configured as required checks in Phase B.

Frontend/backend jobs publish separate production artifacts. E2E downloads only
named artifacts from the **current workflow run**, with digest mismatch treated
as an error. It verifies each output file's SHA-256 and the exact checkout commit
and workflow run recorded in provenance. It serves Vite's built hashed assets
with `vite preview`, proxies `/api` to the published Release API, and asserts both
the asset path and proxied health response. It never rebuilds the downloaded API
or replaces production output with a dev server.

Loopback ports 5001/5174 must be free; occupied ports fail before service startup.
Readiness requests have one-second connection/response bounds and a 30-second
deadline. The API runs on a new temporary SQLite file per full execution; both
phases share that file across an actual API process restart. Chromium uses one
worker, explicit zero retries, and focused-test rejection. Unknown/missing phases
fail at configuration load. CI installs Playwright 1.64.0's matched Chromium.
Restricted cloud runs explicitly report the optional system Chromium fallback.

Each execution retains a unique `.artifacts/e2e/run-*` directory with startup
logs, proxy evidence, scenario/commit identity, JUnit, HTML, failure screenshots/
traces, successful validation/persistence screenshots, and a cleanup result.
Temporary database directories are removed after stopping/reaping only owned
child PIDs. Teardown has a bounded graceful wait before killing a surviving
owned process. Qualification keeps all ten runs and stops on the first failure;
failed attempts are not replaced by successful retries.

## Runners, tools, evidence, and costs

Linux stays on ubuntu-24.04; Windows stays on windows-2025 with Git Bash repeated
setup and build only. Validation timeouts remain ten minutes, gate two minutes.
Superseded runs are cancelled. Tokens are contents:read; checkout credentials are
not persisted. Supply-chain checkout fetches full history for secret scanning.
The privileged metadata-only attribution workflow is unchanged and never runs
PR code. No permission, visibility, merge, deployment, or protection changes occur.

Existing full-SHA pins for checkout v5, setup-node v5, setup-dotnet v5, and
upload-artifact v7 are retained. Download-artifact v8 is pinned to
`9000827ccba6bdab643e8b6fd33ac0654aef8333`; its Node 24 manifest and current-run
artifact selection were inspected. Archive tools use explicit SHA-256 pins.
All policy changes require independent human review.

Dependency download caches retain Phase A's OS/lock/toolchain keys. Routine
artifacts, including diagnostics from failed jobs and production outputs, retain
seven days. Missing artifacts fail upload. GitHub step summaries record counts,
coverage, and aggregate head/tested merge SHAs. The acceptance report retains
summaries and immutable run/commit links beyond artifact expiry. Review screenshots
alongside tests, not as a replacement for assertions.

No new paid service or browser matrix is introduced. Ten-run qualification is
performed by the single E2E job; actual wall time and aggregate runner duration
are measured from Actions metadata in the report. Security advisories and hosted
images can change between runs, so a historical green result is not a perpetual
security guarantee. Main-push verification follows only an owner-performed merge.

## Explicit protected-policy changes

Phase B adds behavioral tests, ordinary TS discovery and complete authored-config
checking; focus/skip/empty/missing-report safeguards; measured coverage floors
without broader exclusions; recommended analyzers, type-aware lint, formatting,
secret and dependency checks; reviewed update PR configuration; production artifact
provenance and ten-run E2E qualification; standards and acceptance evidence.

The ESLint-10-compatible accessibility fork, obsolete no-floor regression test
replacement with floor rejection tests, and repository-wide formatting are
explicit proposals. Historical plan/report formatting changes carry no semantic
changes. No existing behavioral assertion is removed; the old creation/list,
validation, reload, and restart checks are retained and strengthened. There are
no operative exceptions, suppressed rules, retries, or lowered coverage targets.
Phase C, independent AI review, orchestration, and merge controls are outside scope.
