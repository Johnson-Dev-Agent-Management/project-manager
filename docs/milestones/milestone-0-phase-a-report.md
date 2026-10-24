# Milestone 0, Phase A acceptance report

Status: **Passed automated acceptance checks; independent human review pending.**
Implementation type: AI
Implementation author: Codex Cloud

PR: [#6, AI-authored draft](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/6).
Starting main: `653ade674f81f90598f4dd92894705834ca007ed`.
Plan source: [PR #5](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/5),
`0fcc272e2a68c3112abaaca7fc0bc0b0715e34ec` (not merged when work began).
Independent reviewer: owner/designated human; not yet reviewed.
The final PR acceptance report records the restored head SHA and its CI run after
completion; the immutable snapshots below retain the initial and failure evidence.

| Criterion | Outcome | Evidence |
| --- | --- | --- |
| A1 | Passed | Fresh hosted Ubuntu restored locked dependencies; npm/NuGet cache misses verified; existing lint/type/build/application/attribution checks passed outside /workspace |
| A2 | Passed | Native windows-2025 Git Bash: setup, repeated setup, frontend/backend builds; zero build warnings/errors |
| A3 | Passed | Hosted matched Chromium executed both phases against isolated SQLite; validation/create/reload/API restart persistence passed |
| A4 | Passed | Frontend 96% lines / 75% branches; backend 100% lines / 75% branches, including untested production scope; no numerical thresholds |
| A5 | Passed | Controlled failing assertion failed frontend and aggregate gate, E2E skipped, diagnostics uploaded; temporary test removed afterward |
| A6 | Passed | Exact snapshots, commands, results, coverage, and limits recorded here and in the PR; human verification remains pending |

## GitHub Actions snapshots

[Initial successful run](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40061933244):
head `09412b1b3103438b7bd88b44031f3137f5ac144a`, tested PR merge commit
`309821208f7a509bd1217aa335e2a4b0ba1ed37d` against the starting main.
All five jobs passed: frontend, backend, windows-smoke, e2e, quality-gate.
All four evidence artifacts were verified as uploaded, with seven-day retention.
Linux setup logs explicitly report npm and Dotnet cache misses; the later E2E
job reused the populated downloads. The runner used standard hosted paths,
not /workspace, without personal dependency credentials.

[Controlled failure run](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40062085174):
head `e2e2ec55de6fe75b014c3fb67992b9fa875dc19e`, tested PR merge commit
`31d7802f1aaa53cef01e6abc315d856034566c03`.
A separately named temporary test asserted `expect(true).toBe(false)`.
Frontend reported 3 existing tests passed / 1 probe failed and exited 1.
Backend and Windows passed; E2E was skipped; quality-gate ran despite those results
and exited 1 with "every required job must explicitly succeed".
[Frontend diagnostics artifact](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40062085174/artifacts/12547971601)
upload was verified: JUnit generation and assertion details are visible in the
[frontend log](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40062085174/job/120777575505).
[Gate log](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40062085174/job/120777912773)
records exact head/merge SHAs and all dependency conclusions.
The probe is intentionally retained in Git history and absent from the final tree;
no existing application assertion was modified to recover green results.

The first run exposed an upstream Node 20 runtime deprecation on upload-artifact
v5. The pin was updated to reviewed v7's full SHA with a Node 24 manifest; the
failure run verified that diagnostic upload still succeeds. Simulated gate
outcomes in Python tests now keep their stdout local to avoid confusing fixture
results with actual CI summaries; assertions are unchanged.

Approximate initial execution timing from the first/last job-log timestamps:
**110 seconds wall span**, **3.49 summed runner minutes**, excluding queue/dispatch
and runner allocation overhead. These are unrounded execution measurements,
not billed minutes; Windows billing multipliers/rounding are not included.
Final/warm measurements are recorded in the PR after the restored run. All
observed feedback is measured against the under-ten-minute target, not promised.

## Commands and results

Passed locally and in the corresponding hosted jobs:

- `bash scripts/setup.sh`: exact Node 24.22.0, npm 11.9.0, SDK 10.0.402;
  `npm --prefix src/web ci`; `dotnet restore tests/ProjectManager.Api.Tests --locked-mode`.
- `bash scripts/check.sh frontend`: npm lint, strict typecheck, frontend build,
  `npm --prefix src/web run test:coverage`; 3 frontend tests, 8 existing attribution
  tests and 4 new report/gate tests.
- `bash scripts/check.sh backend`: `dotnet build tests/ProjectManager.Api.Tests --no-restore`;
  `dotnet test tests/ProjectManager.Api.Tests --no-build --no-restore --collect:"XPlat Code Coverage" --settings tests/coverage.runsettings --logger "trx;LogFileName=tests.trx" --results-directory "$ROOT/.artifacts/backend"`;
  4 integration cases; zero build warnings/errors.
- `bash scripts/build.sh`: frontend and backend/test-project builds; Windows also
  reruns setup to demonstrate repeatability.
- `npx --prefix src/web --no-install playwright install --with-deps chromium` and
  `bash scripts/e2e.sh`: Playwright 1.64.0 matched Chrome/Headless Shell
  156.0.8078.4, revision 1248; 1 browser scenario in each of 2 phases.

Passed additionally in the cloud container: complete `bash scripts/check.sh`,
`python3 -B scripts/python-tests.py`, Bash syntax checks, YAML parsing,
`git diff --check`, and development startup smoke with API health, Vite proxy,
and released dev/E2E ports. Local browser fallback was explicitly reported:
Chromium 151.0.7922.173. Local Python was 3.12.14; hosted Python versions are in
per-job tool-versions artifacts. No tests were skipped on successful runs.

Failed, as expected: the controlled assertion and aggregate gate above. There
are no known unresolved application/CI failures in the accepted snapshots.
Initial shell fetch without network socket permission failed; enabling the
already-authorized per-command network access resolved it.

Not run: main-push and manual-dispatch events before owner merge; manual
`cold-cache` input (the initial cache-miss bootstrap was observed instead);
Windows browser E2E; cache-empty saved cloud image publication; security scanning
or clean advisory-data acceptance; Phase B/C work; independent human review.

## Coverage and protected policy

| Production codebase | Lines | Branches | Tool |
| --- | --- | --- | --- |
| Frontend | 96% (24/25) | 75% (18/24) | Vitest/V8 coverage 5.0.3 |
| Backend API | 100% (17/17) | 75% (3/4) | Coverlet collector 6.0.4 / Test SDK 17.14.1 |

Frontend includes unimported production files, including main.tsx at 0% lines;
exclusions are tests, test setup, and type declarations. Backend instruments the
whole API assembly, excluding test/third-party assemblies and generated obj
sources. Auto-properties remain included. No numerical floors are enforced.
[CI operations](../ci.md) records exact configuration and proposed policy changes:
new CI/composite setup and immutable pins; portable root scripts and npm pin;
report/discovery guards and their tests; V8/Coverlet dependencies and locks;
coverage inclusion/exclusions; Playwright diagnostics; operating documentation.
Existing product, integration, browser, and attribution assertions, compiler/lint
rules, and the privileged metadata-only attribution workflow are unchanged.
These proposals require independent policy review and do not establish enforcement.

Screenshots: **Not applicable** to this infrastructure-only change. E2E failures
retain screenshots/traces; the intentional frontend-unit failure needs no UI image.

## Risks and owner actions

- Independent human verification of workflow links, tested commit, controlled
  failure, and protected-policy changes remains required before accepting A.
- GitHub API reports repository visibility **public**, contrary to the plan's
  private assessment. No visibility setting was changed. Owner must resolve intent.
- The connector uses the owner's existing contribution identity and reports
  administrative permission. No credentials/permissions changed. Distinct
  implementation/reviewer identities and enforceable controls remain unproven.
- PR #5 still holds the unmerged plan. Owner controls its review/merge.
- Main-push CI needs an owner-authorized merge to observe. No merge performed.
- Artifacts expire after seven days; the PR, immutable commit/run links, and this
  report retain the acceptance summary beyond that period.
- No purchases, deployment, new services, GitHub permissions/protection changes,
  independent AI review, or Phase B/C implementation. Phase B needs separate
  authorization after Phase A acceptance; this report does not authorize it.
