# CI operation — supervised development

Use this document for routine validation; start from current main and follow
[AGENTS.md](../AGENTS.md). All seven jobs and their thresholds remain required.
M0 is complete for supervised development; its [closeout report](milestones/milestone-0-closeout-report.md)
and [branch-control evidence](branch-enforcement.md) record the accepted foundation.
The historical disposable-base trigger does not require creating a target or
repeating closeout probes for feature work. The ten exact historical scanner
fingerprints are the sole active false-positive exclusion, approved in PR #16.
Their existing review/renewal deadline remains tracked in [issue #17](https://github.com/Johnson-Dev-Agent-Management/project-manager/issues/17).
Historical M0 validation passed on `0e6b05f350b5f2a5b90b07414e8e113093d80360`
([post-merge run](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/41577510318));
each new PR needs its own current-commit results.

Run in an authorized cloud checkout. Exact Node 26.13.0 LTS, npm 12.2.1, and
.NET SDK 10.0.402 remain pinned. Setup uses npm ci and locked NuGet restore;
All platforms select project Node/npm from a versioned ignored `.tools` directory
when host versions differ. Native Windows uses Git Bash and the pinned native
.NET SDK on PATH; `cygpath -am` database conversion is preserved. Newer host
Node/npm can bootstrap setup without matching the project pins first.
`PROJECT_BOOTSTRAP_NODE=true` forces a workspace installation, and
`PROJECT_NODE_DIR` selects an isolated directory. The Windows job uses a fresh
runner-temp directory to exercise native bootstrap, then repeats setup/build.
The shared Actions setup publishes the selected private tool paths to later steps
and records actual selected versions; it no longer installs npm globally.
There is no required `/workspace` location or dependency on personal credentials.

## Local and hosted validation

Here, local means the authorized cloud checkout, never the owner's computer.
Use focused tests while iterating and the following division of work for handoff:

| Validation                     | Cloud checkout                                                                                                                                                    | Hosted CI on every PR, including documentation                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Setup and application checks   | Run `setup.sh` for the checkout's pins/locks, relevant tests, and complete `check.sh` before handoff. Documentation-only work needs no invented behavioral tests. | Frontend/backend builds, tests, coverage floors and report integrity remain required. |
| Formatting and policy          | Run `policy.sh` when available; check changed-file formatting even when a policy-tool download is blocked. Exercise affected policy checks for policy changes.    | Full `policy` job is required.                                                        |
| Security                       | Run `security.sh` when available, especially for dependency/security changes; record unavailable downloads or advisory data accurately.                           | Fresh advisory retrieval and both secret scans in `supply-chain` are required.        |
| Browser E2E                    | Run `e2e.sh` for application behavior/integration changes when supported. For documentation-only changes, hosted E2E suffices.                                    | Ten consecutive full runs without retries remain required in `e2e`.                   |
| Repeated browser qualification | Run `e2e-qualify.sh` locally for browser/harness reliability changes or diagnosing flakes; routine work need not duplicate the hosted ten runs.                   | Always runs; this is an ongoing requirement, not a retired milestone exercise.        |
| Windows compatibility          | Use the hosted smoke job; no execution on the owner's machine is authorized.                                                                                      | Native setup, repeated setup and build remain required.                               |

Record local commands as Passed, Failed, or Not run, with exact limitations. A
blocked cloud tool does not require permission/network changes or repeated download
attempts: publish a draft with the limitation, then verify the equivalent hosted
job at the current head. A successful equivalent hosted check can supply the missing
validation evidence; it does not turn the local result into a pass. Investigate code
failures rather than dismissing them as environment limitations. Until all required
evidence is verified, report Draft prepared with pending/blocked validation, using
the [handoff states](engineering.md#handoff-states).

The complete command reference below is available for diagnosis and full local
validation; it is not a requirement to repeat every hosted job in every checkout.

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
analysis policy, and the current exception register. The [Phase A report](milestones/milestone-0-phase-a-report.md)
is historical evidence; the current closeout report records the approved merge
and post-merge outcomes.

## Workflows and production browser testing

`Foundational CI` retains every PR to main (including drafts), push to main,
and manual dispatch with `cold-cache`. No path filters. Stable check names:
**frontend**, **backend**, **windows-smoke**, **e2e**, **policy**, **supply-chain**,
and **quality-gate**. E2E depends on frontend/backend. The always-running aggregate
gate accepts only explicit success from all six dependencies, rejecting missing,
failed, skipped, and cancelled jobs. Python tests exercise each dependency's
failure outcomes. All seven names are required from GitHub Actions (App 15368);
the closeout report retains the owner-provided detailed review/up-to-date readback.

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
coverage, and aggregate head/tested merge SHAs. The PR (or milestone acceptance report)
retains conclusions and immutable run/commit links beyond artifact expiry. Review screenshots
alongside tests, not as a replacement for assertions.

No new paid service or browser matrix is introduced. Ten-run qualification is
performed by the single E2E job. Measure wall time and aggregate runner duration
when changing CI or investigating cost/performance; routine PRs can link the run.
Security advisories and hosted
images can change between runs, so a historical green result is not a perpetual
security guarantee. Main-push verification follows only an owner-performed merge.

## Historical M0 policy changes

This section records implemented changes, not pending assignments. Current policy
is described above and in engineering standards; new policy proposals still need
explicit rationale and independent human review.

Phase B added behavioral tests, ordinary TS discovery and complete authored-config
checking; focus/skip/empty/missing-report safeguards; measured coverage floors
without broader exclusions; recommended analyzers, type-aware lint, formatting,
secret and dependency checks; reviewed update PR configuration; production artifact
provenance and ten-run E2E qualification; standards and acceptance evidence.

The ESLint-10-compatible accessibility fork, obsolete no-floor regression test
replacement with floor rejection tests, and repository-wide formatting are
reviewed implementation changes. Historical plan/report formatting changes carried no semantic
changes. The creation/list, validation, reload, and restart checks were retained
and strengthened. The later closeout added the ten exact historical false-positive fingerprints.
No coverage target, security severity threshold, discovery rule or retry
policy was relaxed. Independent AI review, orchestration and automatic merging
remain outside M0 scope.
