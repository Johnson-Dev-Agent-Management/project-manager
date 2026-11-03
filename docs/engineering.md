# Engineering standards

These are the standing standards for supervised application development.
Start with [AGENTS.md](../AGENTS.md) and [CI operation](ci.md). M0 is complete;
the [closeout report](milestones/milestone-0-closeout-report.md) records accepted
controls and their limits. Phase plans/reports are historical context.
Standards, tests, fixtures, thresholds, scripts, dependency locks, and workflows
are protected policy requiring independent human review. A green run does not
replace that review. Agents may implement task-scoped test changes and propose
policy changes in the draft PR without a separate pre-edit approval. Explain their
effect; do not remove assertions, lower floors, hide failures, or activate exceptions
to obtain green results. Exception activation still requires the approval below.
Credential-isolation certification and exhaustive adversarial testing remain deferred.

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
These are the baseline contracts; change them only as part of assigned behavior and
update their tests/documentation together. Do not invent name length/uniqueness limits.
Authentication, shared access,
deployment, and production migrations remain separate work.

### Development database schema changes

The API currently calls `Database.EnsureCreated()` at startup. It creates a fresh
SQLite schema but does not upgrade an existing database. `scripts/dev.sh` retains
synthetic data in ignored `.data/projects.db`; tests use temporary databases.
Passing fresh-database tests alone does not establish compatibility with existing data.

For a schema-changing feature, state the development-data strategy in its PR:

- If data must survive, implement and test the task-scoped upgrade using a temporary
  copy of the old schema with synthetic rows; verify retained data and new behavior.
- If disposable development data may be reset, document that limitation and the
  exact database path. Prefer a fresh task-owned database. Reset only a database
  known to be disposable and within the assigned scope, after stopping its services;
  do not delete another session's database or silently reset data at startup.
  Confirm an empty database starts and persists the new behavior across restart.
- If existing data ownership or preservation requirements are unclear, continue
  against isolated synthetic storage and obtain that decision before modifying it.

Document the chosen setup/reset or upgrade steps when they affect development.
This is scoped feature work; a production migration platform is not a prerequisite.

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

Add behavioral coverage for changed requirements using existing suites. A copy-only
or documentation change need not invent new tests; update affected assertions when
needed and explain applicability in the PR. Preserve existing regression coverage.
The enforced floors remain **80% lines / 70% branches independently for each
production codebase**. Vitest
V8 enforces the frontend floors; the shared evidence reader independently checks
both codebases without rounding values up. Regression tests exercise each floor,
missing suites/files, stale output, incomplete audits, and aggregate failures.

Frontend coverage includes every `src/**/*.{ts,tsx}` production file, including
unimported `main.tsx`. Only `.test.ts`/`.test.tsx`, `test-setup.ts`, and type-only
`.d.ts` files are excluded. The evidence reader cross-checks this inventory.
Backend Coverlet instruments the whole API assembly; generated `obj`, tests, and
third-party assemblies remain outside scope. Auto-properties stay included;
default Coverlet attribute handling is unchanged, and no authored coverage
exclusion attributes are present. Formatting changes line denominators; when coverage
changes, explain the relevant counts/percentages in PR evidence. Unchanged results
may be linked from the current CI summaries instead of copied into a new report.

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
setup/build smoke check and full `check.sh` suite, including Python regressions,
plus development lifecycle and a production browser scenario. Unsupported hosts
fail with an explicit Linux x64 requirement before policy-tool installation.

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
For unchanged findings, link the existing disposition and confirm the current audit
still matches its scope and review/expiry conditions; triage new or changed findings.

Gitleaks scans full checked-out history and a temporary copy of tracked working-tree
files using upstream default rules and 100% redaction. The only active false-positive exclusion is the ten exact historical fingerprints
in `.gitleaksignore`; no broad path, rule or hash exemption is permitted.
Never put real secrets or database files in a fixture, log, screenshot, or commit.
Weekly Dependabot PRs cover npm, both NuGet projects, and Actions, with three open
PRs per ecosystem. Updates require the same tests and human policy review; no
auto-merge configuration is added. Tool archive pins need explicit reviewed updates.

**Current exception register:** the [M0 closeout report](milestones/milestone-0-closeout-report.md)
records the ten historical artifact-hash fingerprints authorized for activation
by the owner's bounded-closeout instruction and subsequently included in
[Joshbomb75's approval of PR #16](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/16#pullrequestreview-5747224859).
The review/renewal deadline is **November 9, 2026 at 4 p.m. Pacific**
(`2026-11-10T00:00:00Z`), tracked in [issue #17](https://github.com/Johnson-Dev-Agent-Management/project-manager/issues/17). No vulnerability blocking threshold is waived. Any proposed exception must identify the
exact rule/advisory and affected paths/package versions, rationale and risk,
named human reviewer, accountable owner, approval evidence, expiry date, and
removal/retest plan. Until approved it is a blocking proposal, never an operative
suppression. Broad exclusions and thresholds lowered to obtain green results
are not acceptable. Expired exceptions fail the definition of done.

## PR evidence and handoff

Routine feature, fix, and documentation PRs use the [PR template](../.github/pull_request_template.md).
Include the behavior/scope, issue or None, exact attribution fields, validation
commands/results, current head and tested CI commit/run links, and limitations.
Identify changed tests/policy and their rationale. Link current CI summaries for
counts, coverage, security, and Windows results; copying every value is unnecessary.
Screenshots help review visible UI changes; use synthetic data. For nonvisual work,
omit screenshots or briefly explain why they are not applicable. They never replace tests.

Keep task evidence in the PR. Update README and other durable documentation only
when contracts, behavior, setup, usage, or policy changes. A full requirement-ID
acceptance report and next-phase recommendation are not required for routine work;
use the [milestone report](milestones/milestone-0.md#standard-acceptance-report) for
assigned milestone work. Record important conclusions in text with immutable links
so they remain understandable after CI artifacts expire.

### Handoff states

| State                            | Required evidence and responsibility                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Draft prepared                   | Agent has implemented the scoped change and opened a draft PR with accurate Passed/Failed/Not run results, pending CI and blockers. This is not a validation or acceptance claim.                                                                                                                                        |
| Validated; awaiting human review | Agent has verified meaningful applicable tests, relevant docs, all seven required CI jobs for the current PR head/tested merge, current advisory data, and no unresolved blocking findings or expired exceptions. Local limitations and matching hosted evidence follow the CI matrix. Leave the PR draft for the owner. |
| Human accepted                   | Independent human review approves the current change, including test/policy changes. The agent does not supply this approval.                                                                                                                                                                                            |
| Owner merged                     | Owner performs the merge after required checks/reviews; verify resulting-main CI when assigned, distinguishing a completed merge from post-merge validation.                                                                                                                                                             |

Report the actual state when handing off; the agent can finish its assigned work
while human review/merge remains pending. A new push requires current validation
and applicable renewed review before acceptance; historical green runs do not count.
