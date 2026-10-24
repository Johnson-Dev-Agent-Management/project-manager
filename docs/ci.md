# Foundational CI — Milestone 0, Phase A

Implementation starts from main `653ade674f81f90598f4dd92894705834ca007ed`.
The assigned plan was read from [planning PR #5](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/5),
commit `0fcc272e2a68c3112abaaca7fc0bc0b0715e34ec`; it was not yet on main.
This implementation does not merge or duplicate that planning change.

## Commands and compatibility

Run from any checkout location with Bash, Python 3, bootstrap Node/npm, curl,
and the platform prerequisites for .NET installed:

```bash
bash scripts/setup.sh
bash scripts/check.sh
bash scripts/e2e.sh
```

Node 24.22.0 (`.nvmrc`), npm 11.9.0 (`.npm-version`), and SDK 10.0.402
(`global.json`, no roll-forward) are checked by setup. Linux/macOS setup can
install the exact tools under ignored `.tools/`; it uses `npm ci` and
`dotnet restore tests/ProjectManager.Api.Tests --locked-mode`. Dependency changes
require intentional lock regeneration. No personal credentials are needed.

`scripts/common.sh` honors tools on PATH and explicit cache variables, supports
`PROJECT_TOOLS_DIR` / `PROJECT_CACHE_DIR`, and reuses sibling prepared cloud tools
and caches if present. Default new tool/cache directories are checkout-relative;
there is no required `/workspace` location. Download caches contain packages,
not node_modules or compiled output. The historical cloud image remains usable.

Native Windows uses **Git Bash** with the exact Windows Node/npm/.NET tools on
PATH. Setup reports missing prerequisites rather than invoking Unix installers.
Existing `cygpath -am` database conversion is preserved. Hosted Windows runs setup
twice and `bash scripts/build.sh` (both frontend and backend/test-project builds).
Windows browser execution is not part of Phase A.

The common root commands used by development and CI are:

| Command | Underlying validation |
| --- | --- |
| `bash scripts/check.sh frontend` | npm lint, typecheck, build, `test:coverage`; Python attribution and CI report/gate tests |
| `bash scripts/check.sh backend` | `dotnet build --no-restore`, `dotnet test --no-build --no-restore` with TRX and Coverlet |
| `bash scripts/check.sh` | Both groups and Python tests |
| `bash scripts/build.sh` | npm build and `dotnet build tests/ProjectManager.Api.Tests --no-restore` |
| `bash scripts/e2e.sh` | Debug API build, isolated SQLite/Vite, Playwright create/reload phase, API restart, Playwright persistence phase |

E2E uses loopback ports 5001/5174, one Chromium worker, no retries, synthetic data,
and a temporary database. It stops test-owned processes and deletes the database.
Logs/reports remain under `.artifacts/e2e/`. CI installs the Chromium matched to
Playwright 1.64.0 (`npx --prefix src/web --no-install playwright install --with-deps chromium`).
Restricted cloud development can explicitly use `PLAYWRIGHT_CHROMIUM_EXECUTABLE`
or the reported `chromium` PATH fallback; CI does not auto-select that fallback.
Production-output E2E improvements belong to Phase B.

## Workflow and evidence

`Foundational CI` runs on every PR targeting main (including drafts), pushes to
main, and manual dispatch. There are no path filters. Stable check names are
**frontend**, **backend**, **windows-smoke**, **e2e**, and **quality-gate**.
E2E waits for frontend/backend; the aggregate gate always evaluates all four
jobs and accepts only explicit success. A failed, cancelled, skipped, or missing
dependency fails the gate. No required validation uses continue-on-error.
These names are documented for later review, not configured as required checks.

Linux uses `ubuntu-24.04`; the small Windows check uses `windows-2025` and Git Bash.
Validation jobs have 10-minute timeouts; the gate has 2 minutes. Superseded runs
on the same PR/ref are cancelled. The token has only contents:read, checkout does
not persist credentials, and no production secrets are provided. The separate
metadata-only privileged `pr-attribution.yml` remains unchanged and never executes
PR code. No GitHub settings or protections are modified.

External Actions are pinned to full SHAs, resolved against the upstream major
tags and inspected through their action manifests for this implementation:

| Action | Major | Commit |
| --- | --- | --- |
| actions/checkout | v5 | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` |
| actions/setup-node | v5 | `a0853c24544627f65ddf259abe73b1d18a591444` |
| actions/setup-dotnet | v5 | `26b0ec14cb23fa6904739307f278c14f94c95bf1` |
| actions/upload-artifact | v7 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |

Setup Actions cache npm/NuGet downloads using OS, lockfiles, and toolchain files.
The initial hosted run must demonstrate cache misses; manual dispatch's
`cold-cache` input disables download caches for subsequent diagnosis.
Browser downloads are not cached. No paid service is added.

Each validation job uploads `.artifacts/` for 7 days even on failure; missing
artifact directories fail upload. Evidence includes setup/check logs, exact
checked-out commit and tool versions, JUnit/TRX, coverage, and browser HTML reports
with failure traces/screenshots. Report validation rejects missing/empty reports,
zero tests, failed/skipped tests, and empty coverage. Python discovery separately
rejects zero attribution or CI evidence tests. Step summaries show counts and
coverage; the aggregate summary records both PR head and tested workflow SHA
(the PR merge ref for normal PR runs). Artifact expiry means acceptance evidence
must also be recorded in the PR and durable acceptance report.

Measure elapsed workflow time and summed job duration after hosted runs; target
warm feedback under ten minutes, with actual usage reported instead of a billing
promise. Main-push behavior cannot be observed before an owner-authorized merge.

## Informational coverage scope

There are **no new numerical coverage thresholds**. Frontend V8 coverage uses
`@vitest/coverage-v8` 5.0.3 with Vitest 5.0.3, includes every `src/**/*.{ts,tsx}`
production file (including unimported `main.tsx`), and excludes only test files,
`test-setup.ts`, and type-only `.d.ts` declarations. Reports: text, JSON summary,
Cobertura, HTML. Existing application test discovery is unchanged in Phase A.

Backend uses Coverlet collector 6.0.4 with Microsoft.NET.Test.Sdk 17.14.1. It
instruments the whole `ProjectManager.Api` assembly, including unexecuted code;
only the test assembly, third-party assemblies, and generated `obj` sources are
outside scope. Auto-properties remain included. Coverlet's default attribute
exclusions (Obsolete, GeneratedCode, ExcludeFromCodeCoverage) are not broadened;
there are currently no authored exclusions using these attributes. Output is
Cobertura; Debug symbols preserve source mapping. Lines and branches are reported
separately for each codebase. Coverage is evidence of execution, not assertion
quality; baseline review and any threshold policy belong to Phase B.

## Proposed protected-policy changes

Independent human review is required for these proposed changes:

- New CI workflow/composite setup, immutable Action pins, read-only token,
  concurrency/timeouts, cache behavior, diagnostics, and success-only gate.
- Portable setup/common scripts, exact npm selection, frontend/backend check
  selectors, build-only smoke entry point, and retained E2E evidence.
- New report validation, zero-test Python discovery guard, and tests of report
  failure cases and the actual gate implementation.
- New V8/Coverlet tooling and locked dependencies; explicit production coverage
  inclusion/exclusions, without thresholds.
- Playwright report/trace configuration; existing application, integration,
  browser, and attribution assertions remain unchanged.
- This CI operating document, acceptance report, README command corrections, and
  a historical-context notice in cloud setup documentation.

No assertions are removed, tests skipped, thresholds lowered, compiler/lint rules
relaxed, or privileged labeling code altered. These are review obligations;
server-enforced policy ownership, independent identities, security hardening,
merge probes, and branch enforcement remain outside Phase A.
