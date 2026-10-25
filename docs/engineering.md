# Engineering standards

Phase B starts from main `688c1bd6c5fdbc5470b0c24abb41e3380a882a86`.
Read the [milestone plan](milestones/milestone-0.md),
[Phase A evidence](milestones/milestone-0-phase-a-report.md), and [CI operation](ci.md).
Standards, tests, fixtures, thresholds, scripts, dependency locks, and workflows
are protected policy requiring independent human review. A green run does not
replace that review. Phase C enforcement and identity separation are not claimed.

## Architecture and contracts

Keep the modular monolith: React/strict TypeScript in `src/web`, ASP.NET Core with
EF Core/SQLite in `src/api`, real database integration tests in `tests`.
Group future frontend complexity by feature; extract rules or persistence only
when useful. The existing HTTP handlers remain small. API request/model/context
types now live in a namespace so recommended .NET analyzers can run without a
CA1050 suppression; no artificial service layer or empty unit-test project is added.

`POST /api/projects` accepts `{ "name": string | null }`. Blank names return
400 `application/problem+json`, `status: 400`, and `errors.name` with the existing
message. Success trims the name and returns 201, JSON `{ id, name }`, and
`Location: /api/projects/{id}`. `GET /api/projects` returns projects in ID order;
`GET /api/health` returns `{ "status": "ok" }`. Rejected requests must not write.
No new name length/uniqueness limits are introduced. Authentication, shared access,
deployment, and production migrations remain separate work.

## Testing and measured coverage

| Requirement or gap            | Behavioral evidence                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading, empty, existing list | `App.test.tsx` and ordinary TS `loading.test.ts`: visible states, submission disabled while loading, server ordering                                    |
| Saving/success                | Real user-event typing/clicking; saving disabled, no duplicate POST, exact request contract, trimmed response displayed, field cleared, appended list   |
| Validation and retry          | All name-error fallback shapes, preserved input/list, re-enabled submission, successful retry clears error                                              |
| HTTP/network errors           | Loading HTTP failure, Error/non-Error rejection; creation Error/non-Error rejection; abort signal on unmount                                            |
| API contracts and no writes   | xUnit validates status/content type/body/Location; blank/null/whitespace and malformed/missing/wrong-type bodies; prior data survives rejection         |
| Ordering, health, restart     | Real SQLite empty state, ID/insertion ordering, health body, trimmed name and ID retained after factory restart                                         |
| Production integration        | Playwright checks hashed frontend assets, preview API proxy, whitespace validation, trimming, create/reload, and API restart using the same SQLite file |

Vitest discovers `src/**/*.test.{ts,tsx}`. TypeScript checks app/tests, E2E, all
root TS configs, and the authored JS ESLint config (`allowJs`/`checkJs`).
Type-aware TypeScript recommended rules, Hooks rules-of-hooks/exhaustive-deps,
and recommended JSX accessibility rules are errors. Vitest/Playwright ESLint
plugins reject focused/skipped tests; runtime `allowOnly: false` / `forbidOnly`
and report readers provide additional checks. xUnit1004 is an error; no skipped
Python, xUnit, or browser result is accepted. Every authored frontend test file,
backend `*Tests.cs` class, and browser spec must appear in its report. Keep backend
suite filenames equal to their class names, with an explicit namespace; report
inventory checks this convention. Empty or missing suites/reports fail.

Review found baseline coverage already exceeded the planned floors but left
saving, abort, error fallbacks, and API contracts weakly asserted. Tests address
those behaviors before introducing **80% lines / 70% branches independently for
each production codebase**. There is no revision to the planned floors. Vitest
V8 enforces the frontend floors; the shared evidence reader independently checks
both codebases without rounding values up. Regression tests exercise each floor,
missing suites/files, stale output, incomplete audits, and aggregate failures.

Frontend coverage includes every `src/**/*.{ts,tsx}` production file, including
unimported `main.tsx`. Only `.test.ts`/`.test.tsx`, `test-setup.ts`, and type-only
`.d.ts` files are excluded. The evidence reader cross-checks this inventory.
Backend Coverlet instruments the whole API assembly; generated `obj`, tests, and
third-party assemblies remain outside scope. Auto-properties stay included;
default Coverlet attribute handling is unchanged, and no authored coverage
exclusion attributes are present. Formatting changes line denominators, so compare
both counts and percentages in the acceptance report.

SQLite fixtures own unique temporary directories and use `Pooling=False`.
Dispose HTTP clients and factories before deleting their database. No global
`ClearAllPools`, EF InMemory replacement, or increase in test parallelism is used.

## Formatting and analysis

EditorConfig defines UTF-8, LF, final newline, spaces (two generally, four for C#
and Python). Prettier 3.9.10 checks supported repository files; only generated,
cache, and dependency directories are ignored. `dotnet format --severity info`
checks both projects; built-in recommended .NET analyzers, nullable checking,
and warnings-as-errors apply to API and tests. xUnit analyzers remain supplied
by the locked xUnit package. No analyzer rule is suppressed.

ESLint 10.12.0 and @eslint/js 10.0.1 remain at Phase A's supported versions.
Accessibility rules use the pinned HTML Academy fork 6.11.0, which explicitly
supports ESLint 10, under the transparent npm alias
`eslint-plugin-jsx-a11y: npm:@htmlacademy/eslint-plugin-jsx-a11y@6.11.0`.
Its package manifest, rule exports, and changes from upstream 6.10.2 were reviewed
for compatibility. The full recommended accessibility rules remain enabled.
This additional dependency source requires human policy review like other tooling;
there is no peer-dependency bypass or lint-rule suppression.

Linux x64 policy tools are pinned by version **and SHA-256** in
`scripts/policy-tools.json`: actionlint 1.7.12, ShellCheck 0.11.0, Gitleaks 8.30.1.
Hashes were obtained from the upstream GitHub release asset metadata. Installation
verifies the archive before extracting only the named executable. Unavailable
downloads fail; no substitute/no-op scanner is used. Platform-specific policy-tool
installation is currently Linux only; Windows retains the required Git Bash
setup/build smoke check.

## Security, exceptions, and definition of done

`npm audit --json --audit-level=high` covers production and development dependencies.
NuGet locked restore forces fresh HTTP/advisory access with `NuGetAuditMode=all`;
warnings, including advisory-access failures, are errors. The subsequent transitive
vulnerability JSON must identify its source and project. NuGet intentionally omits
frameworks when no vulnerable packages are found. Malformed/missing/error data
fails the parser; high/critical advisories block. Medium/low findings must be
listed and triaged with reachability/impact, remediation, owner, and review decision
in the PR. NuGet warnings-as-errors currently blocks medium findings too until
reviewed. Do not treat unavailable advisory data as clean.

Gitleaks scans full checked-out history and a temporary copy of tracked working-tree
files using upstream default rules and 100% redaction. No new allowlist is added.
Never put real secrets or database files in a fixture, log, screenshot, or commit.
Weekly Dependabot PRs cover npm, both NuGet projects, and Actions, with three open
PRs per ecosystem. Updates require the same tests and human policy review; no
auto-merge configuration is added. Tool archive pins need explicit reviewed updates.

**Current exception register: none.** Any proposed exception must identify the
exact rule/advisory and affected paths/package versions, rationale and risk,
named human reviewer, accountable owner, approval evidence, expiry date, and
removal/retest plan. Until approved it is a blocking proposal, never an operative
suppression. Broad exclusions and thresholds lowered to obtain green results
are not acceptable. Expired exceptions fail the definition of done.

Done means meaningful regression coverage, all required commands and CI results
for the exact tested commit, accurate Passed/Failed/Not run evidence, current
advisory retrieval, documented policy changes, no unresolved blocking findings,
and independent human review. Owner acceptance/merge remains separate.
