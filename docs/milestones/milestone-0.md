# Milestone 0 — Trusted Development Foundation

## Status and purpose

The owner approved the architecture and implementation sequence, refined into
Phases A, B, and C below. This document makes that agreement available to future
agents. It is a plan, not evidence that any phase has been implemented or accepted.

The goal is reproducible, independently enforced development checks for the
Project Dashboard application in Johnson-Dev-Agent-Management/project-manager.
Milestone 0 remains supervised: automated validation and human approval establish
the foundation for later autonomy.

This documentation change does not authorize implementation. Start only the
explicitly assigned phase. The owner retains authorization for merges, releases,
deployments, purchases, visibility changes, and GitHub permission/configuration
changes. Preserve the current authentication arrangement unless the owner
authorizes a change. A new chat must read this document and applicable AGENTS.md
files rather than assume it inherits the planning conversation.

## Repository assessment and evidence limits

Planning baseline: main at
[653ade674f81f90598f4dd92894705834ca007ed](https://github.com/Johnson-Dev-Agent-Management/project-manager/tree/653ade674f81f90598f4dd92894705834ca007ed).
Reinspect current main at the beginning of each phase.

| Area | Baseline and implications |
| --- | --- |
| Ownership | The repository is private and organization-owned. The owner reports a GitHub Team subscription; billing and effective settings require owner verification. |
| Bootstrap | The cloud scaffold is merged. Use current main, not the historical codex/cloud-bootstrap branch. |
| Frontend | React, strict TypeScript, Vite, ESLint, Vitest, React Testing Library, jest-dom, and jsdom already exist. Preserve the frameworks. |
| Backend | ASP.NET Core targeting .NET 10, EF Core, SQLite, xUnit, and WebApplicationFactory already exist. Existing backend tests are integration tests. |
| Toolchain | Node and .NET SDK versions are pinned in .nvmrc and global.json. npm and NuGet locks are committed. Record and consistently use the tested npm version as well. |
| Behavior | Creation/listing, trimming, invalid-name rejection, and persistence are implemented. Playwright exercises creation, validation, reload, and API restart in two phases. |
| Commands | scripts/setup.sh, check.sh, dev.sh, and e2e.sh exist. Windows shell handling has been added, but non-Windows paths still assume /workspace. |
| Attribution | A PR template, metadata-only attribution workflow, attribution documentation, and Python attribution tests exist. The label is spelled AI-authored. |
| CI and protection | At planning inspection, only the attribution workflow existed; the Actions API returned zero runs, main was unprotected, and the rulesets API returned an empty list. This does not establish whether Actions is enabled. |
| Coverage | No measured, accepted coverage baseline or enforced coverage targets have been established. |
| Production | Authentication, authorization, deployment, and migration-based schema management remain outside this milestone. |

Earlier cloud inspection passed three frontend tests, four backend integration
cases, and both browser phases. Those historical results are not acceptance
evidence for current main. NuGet vulnerability retrieval produced NU1900 warnings,
and the environment reused caches; a clean security audit and cache-empty
bootstrap still need proof.

The owner's Windows checkout supports manual review. Agent execution remains in
its authorized cloud environment. Preserve local Windows usability without
assuming permission to execute on the owner's computer.

## Principles and scope

- Prefer existing frameworks and mature tools over custom infrastructure.
- Separate implementation from approval and independent validation.
- Favor reproducible compiler, analyzer, test, and policy checks.
- Measure coverage before enforcement; improve behavioral confidence before metrics.
- Keep all validation on synthetic data, isolated services, and temporary databases.
- Make failures, missing evidence, and infrastructure limitations visible.
- Control runner usage, concurrency, artifact retention, and external-service costs.
- Produce an understandable acceptance report for every phase and implementation PR.

Do not add product features, independent AI review, agent orchestration, automatic
merging, deployment infrastructure, or a broad architectural rewrite in M0.

## Owner decisions and configuration boundaries

| Decision/action | Recommended direction | Timing and evidence |
| --- | --- | --- |
| GitHub plan and ownership | Keep the organization repository private; verify Team entitlement for required protections. | Confirm before Phase C acceptance. Record effective settings, not just the subscription name. |
| Implementation and review identities | Use distinct authenticated identities. A restricted machine user is a candidate; a GitHub App is an alternative if supported end to end. | Choose the contribution path before implementation PRs; prove independence before claiming enforcement. |
| Credential separation | Scope implementation access to this repository, without administration, rule bypass, or access to the reviewer's credentials. | Verify cloud Git and connector/API identities separately. A different Git author name is insufficient. |
| Account/installation cost | Machine-user private-repository access may require an additional paid seat. Apps require supported token management. | Owner approves any expense or installation change. Neither route is assumed configured. |
| Actions and budget | Permit required workflows on hosted runners, use restricted token defaults, and approve a spending/usage limit. | Before Phase A CI execution; do not broaden settings or buy credits implicitly. |
| Policy owner | Designate a human reviewer for CI, tests, thresholds, standards, and associated scripts. | Identify before implementation; enforce in Phase C. |
| Merge controls | Owner-controlled merging, required checks/reviews, no implementation-agent bypass. | Activate and verify in Phase C. |
| Visibility | Preserve privacy. Publication is a separate owner decision. | Never make public as an implicit workaround for billing or permissions. |

Attribution and authentication are separate. AI-authored identifies the declared
implementer; it cannot prove a separate PR author, an independent approval, or
successful validation. A PR author cannot approve their own PR merely by switching
sessions. If a PR is owner-authored, use another qualified reviewer or an explicitly
authorized distinct contribution identity; do not bypass approval rules.

Unresolved identity questions must be documented. The owner may explicitly
authorize limited CI preparation while they are being resolved, but successful
Phase A/B checks alone must not be described as an enforceable pipeline.

## Phase A — Foundational CI

### Scope and ordered tasks

1. Inspect current main, agent instructions, scripts, dependency locks, existing
   tests, open work, and GitHub access. Record the starting SHA.
2. Make setup/check/E2E entry points portable to hosted Linux runners while
   preserving the existing Windows Git Bash workflow. Remove unconditional
   cloud-path assumptions without breaking the published cloud environment.
3. Use pinned Node/.NET and a recorded npm version, npm ci, and locked NuGet
   restore. Confirm a fresh runner can bootstrap without the owner's credentials.
4. Add pull-request and main-branch CI for existing frontend lint/type checking,
   frontend/backend builds and tests, Python attribution tests, and browser E2E.
   Keep metadata labeling separate from code execution.
5. Add a small Windows setup/build smoke check using the supported shell, within
   the approved budget. Do not require a complete second browser matrix.
6. Collect frontend/backend coverage as information only. Include untested
   production files, document exclusions and tool versions, and record line/branch
   results separately. Do not introduce the 80%/70% floors in this phase.
7. Upload test results and useful diagnostics, produce a concise CI summary, and
   prepare the Phase A acceptance report and AI-authored draft PR.

### CI architecture

Use a small GitHub Actions workflow with stable, unique check names. Proposed
jobs are frontend, backend, windows-smoke, e2e, and quality-gate; Phase B adds
policy and supply-chain. Run the Python attribution tests in an appropriate
existing job in A, moving them to policy in B if useful. Record the final names
in docs/ci.md before configuring required checks.

Frontend and backend can execute concurrently. E2E depends on successful builds;
quality-gate depends on every required job. Run on all PRs targeting main,
including drafts, and on pushes to main. Support manual diagnosis. Avoid path
filters at this repository size so documentation-only PRs also get checks.

The quality gate must evaluate dependencies even after a failure, and accept
only explicit success for every required job. Reject failed, cancelled, or skipped
dependencies. Missing reports and zero discovered tests must fail the relevant job.
Do not use continue-on-error on required validation.

Use a fixed hosted Ubuntu release and explicit timeouts. Pin external Actions
to reviewed full commit SHAs. Restrict validation tokens to read-only access,
disable persisted checkout credentials, and provide no production secrets. Never
execute PR code in the privileged pull_request_target attribution workflow.

Use lockfile/toolchain-keyed download caches; prove that cache misses still work.
Cancel superseded PR runs, use one Chromium worker initially, and retain routine
artifacts for roughly seven days. Target warm PR feedback under ten minutes,
then measure actual elapsed time and aggregate runner minutes rather than promise
a particular bill. No new paid service is required by the design.

Reuse root command definitions between CI and development. Preserve nonzero exit
codes and tool output. Install Playwright's version-matched Chromium in GitHub CI;
an explicitly reported system-browser fallback may remain for restricted cloud
development.

### Phase A acceptance criteria

- A1: Fresh hosted Linux execution restores locked dependencies and runs all
  existing application and attribution checks without /workspace assumptions.
- A2: The Windows setup/build smoke check passes using documented commands.
- A3: Both browser phases execute against isolated services and real SQLite,
  covering validation, creation, reload, and restart persistence.
- A4: Frontend and backend line/branch coverage is measured and reported with
  scope/exclusions; no new numerical threshold is enforced.
- A5: A controlled failed build/test makes the relevant job and aggregate gate
  fail; diagnostics remain available. Full permission/merge probes belong to C.
- A6: Reports identify the exact commit and distinguish Passed, Failed, and Not run.
  Infrastructure limitations are recorded rather than presented as passing tests.

An independent human verifies workflow links, the tested SHA, reports, and the
controlled failure. Local success alone does not satisfy A. This phase does not
claim required-check enforcement.

## Phase B — Testing and security hardening

Depends on accepted Phase A and authorization for B.

### Scope and ordered tasks

1. Review A's coverage and behavioral gaps. Map requirements to tests before
   changing thresholds. Add meaningful assertions instead of tests that merely
   execute code or mirror implementation.
2. Preserve Vitest/React Testing Library and xUnit/WebApplicationFactory. Add
   user-event for realistic interactions where useful; introduce MSW only when
   shared API scenarios justify it. Pure backend unit tests should target actual
   extracted rules, not an empty new test project.
3. Expand frontend discovery to .test.ts and .test.tsx. Type-check E2E and authored
   configuration files as well as application code. Reject focused tests,
   unexplained skips, missing reports, and empty suites.
4. Strengthen coverage of loading, empty, saving, success, validation, HTTP, and
   network error states. Backend tests should assert response contracts, trimming,
   invalid inputs, no writes after rejection, ordering, health, and persistence.
   Do not invent new product limits without approved acceptance criteria.
5. Keep real SQLite integration tests, with a separate temporary database per
   test/isolated fixture. Audit global SQLite pool cleanup before increasing
   parallelism. Do not replace database integration with EF InMemory.
6. Run Playwright against the production frontend build and published Release API.
   Consume artifacts only from the same workflow run/commit, and verify API proxying.
   Reject invalid phases, bound readiness waits, detect occupied ports, and retain
   logs/traces before cleaning up test-owned processes and files.
7. Add formatting checks, selected type-aware ESLint/React Hooks/accessibility
   rules, .NET analyzers/nullable checks, and warnings-as-errors with narrow reviewed
   exclusions. Use EditorConfig, Prettier, dotnet format, actionlint, and ShellCheck
   as appropriate rather than a custom standards engine.
8. Add pinned secret scanning and npm/NuGet vulnerability checks, plus reviewed
   dependency-update PR configuration. Block high/critical findings, triage medium
   findings, and treat unavailable advisory data as incomplete/failing validation.
9. Establish coverage enforcement after baseline review and meaningful test work.
   The proposed targets are 80% lines and 70% branches for each production
   codebase independently, using Vitest V8 coverage and Coverlet. If targets
   require revision, seek an explicit reviewed policy decision; never lower
   them silently. Security advisories can change independently of source commits.
10. Document architecture, testing, CI operation, exceptions, and definition of done
    in concise contributor documentation linked from AGENTS.md.

Keep the modular-monolith direction: feature-oriented frontend modules, clear
API request/response contracts, thin HTTP handlers, and separated rules/persistence
when complexity warrants it. Avoid a large refactor just to create layers.
Authentication, deployment, and production database migrations remain later work.

CodeQL/private code-scanning integration is optional and entitlement-dependent.
Core static analysis must work without a new paid service.

### Phase B acceptance criteria

- B1: Tests cover the agreed behavior and identified gaps; test discovery includes
  ordinary TypeScript tests and all authored TS configuration is checked.
- B2: Coverage targets are enforced only after measurement and review; untested
  production files remain included and exclusions are documented.
- B3: E2E uses build output and real persistence; ten consecutive full executions
  with fresh scenario storage pass without test retries concealing flakes.
- B4: Formatting, selected analyzers, test integrity, secrets, and dependency
  security are checked with useful diagnostics. Advisory retrieval succeeds.
- B5: Any exception identifies the exact rule/advisory, rationale, reviewer, owner,
  and expiry; broad suppression is not accepted.
- B6: An independent human can reproduce the evidence from the Phase B report.

## Protected policy and engineering standards

Protected policy includes CI definitions, scripts invoked by CI, test definitions
and fixtures, discovery settings, coverage thresholds/exclusions, compiler/analyzer
settings, security exceptions, dependency/tooling configuration that controls
validation, AGENTS.md, CODEOWNERS, this plan, and engineering standards.

Implementation agents must explicitly describe proposed policy changes and their
effect. They must not silently remove assertions, skip suites, replace checks
with no-ops, relax thresholds, hide failures, or broaden exclusions to obtain
green results. Legitimate changes need independent review and recorded rationale.

Before C, this is a review obligation, not a claim of server-enforced protection.
In C, protect policy through required reviews and CODEOWNERS, including ownership
of CODEOWNERS itself and a fallback owner for newly added files.

Definition of done for implementation: approved scope/criteria, meaningful tests
and regression coverage, relevant documentation, successful validation for the
current commit, an honest acceptance report, and independent approval without
unresolved blocking findings. Owner merging is a separate action.

## Phase C — Branch enforcement and deliberate-defect verification

Depends on accepted A/B, authorization for C, and resolution of plan eligibility,
PR authorship, independent approval, and credential separation.

### Owner configuration and validation

1. Identify the implementation principal, human reviewer, and merger. Verify
   actual cloud Git and API/connector authentication, repository scope, and absence
   of implementation-agent administrative or bypass privileges.
2. Configure an active main-branch ruleset or equivalent branch protection:
   require PRs, the final named CI checks, up-to-date branches, independent approval,
   CODEOWNERS review, stale-approval dismissal/latest-push review, and conversation
   resolution. Block force pushes/deletion and disallow normal administrative bypass.
3. Restrict protected-branch updates to the owner/designated merger where supported,
   while retaining the quality/review requirements. No implementation identity gets
   bypass. Keep auto-merge disabled.
4. Confirm the expected check source and unique names after successful pilot runs.
   Add policy and supply-chain checks without removing existing required coverage.
5. Capture effective settings and exercise the verification matrix below using
   actual implementation credentials. Administrative read limitations require
   owner-provided configuration evidence, not guessed settings.
6. Review results, perform only the owner-approved merge, verify the subsequent
   main run, and refresh the cloud environment baseline.

CODEOWNERS must be on the target branch to govern later PRs; its first introduction
requires explicit bootstrap review. Multiple owners on one matching rule do not
mean all must approve. Do not list the implementation identity as an alternative
policy approver.

Required check names and an expected GitHub Actions source do not authenticate
a specific workflow implementation: editable workflows can publish misleading
checks. Independent policy review remains required. Administrators can change
protections; administrative credentials must remain outside agent reach.
Central organization-required workflows may improve this boundary later, but
must not be assumed available on the current plan.

### Deliberate-defect verification matrix

Use disposable PRs and an owner-approved disposable branch/private test repository
with equivalent protections. Never merge defective changes or force-push/delete
main. Draft status alone is not proof that gates prevent merging.

| Probe | Expected independently observed result |
| --- | --- |
| Valid application change with appropriate tests | All checks pass; eligible after independent approval. |
| Documentation-only change | All required checks appear and complete. |
| TypeScript error; C# compiler/analyzer violation | Respective job and aggregate gate fail. |
| Failed frontend/backend assertion | Tests and aggregate gate fail. |
| Remove blank-name validation | Backend and browser behavioral tests detect the regression. |
| Break UI submission or restart persistence | Real browser/database tests fail, even if mocked tests pass. |
| Manifest/lock mismatch | Locked restore fails. |
| Reduce coverage below approved floor | Coverage check fails. |
| Focus/skip tests, remove discovery, or omit reports | Integrity checks fail; no empty green run. |
| API startup/readiness failure | Bounded failure with diagnostics and cleanup. |
| Cancel or skip a required job/workflow | Merge remains blocked; missing evidence is not success. |
| Replace tests/checks with a no-op or lower thresholds | Required policy review blocks acceptance; a green modified workflow is insufficient. |
| Change/remove CODEOWNERS | Base-branch review requirements still apply. |
| Spoof required status from an unauthorized source | Expected-source restriction prevents acceptance. |
| Push after approval or advance main | Fresh approval/base validation is required as configured. |
| Direct push, force push, or deletion with agent credentials | Rejected on the disposable protected target. |
| Synthetic secret fixture or controlled vulnerable dependency | Security check detects it; never use a real secret or execute a vulnerable package solely for this probe. |
| Advisory-service failure | Security result is incomplete/failing, not clean. |

Record expected/actual outcome, commit SHA, check conclusions, mergeability, and
evidence links for each probe. Repeat relevant probes after changes to workflows,
permissions, protection settings, or credentials.

### Phase C acceptance criteria

- C1: Eligible GitHub protections are active and their actual settings are recorded.
- C2: Implementation and review identities are distinct; agent credentials cannot
  administer/bypass controls, approve their own work, or update protected main.
- C3: Every required check and independent policy approval is enforced.
- C4: Valid and defective probes produce the expected outcomes with traceable evidence.
- C5: Recovery/exception procedures are documented without silent bypasses.
- C6: The owner accepts the report and any authorized merge has a successful main run.

Only after C is accepted may M0 be called an enforceable development foundation.
Unresolved account/credential questions or untested protections block that claim.

## Standard acceptance report

Attach this concise report to each implementation PR and phase handoff. Extend the
existing PR template; retain its exact attribution fields. Store durable milestone
evidence in the repository when appropriate and link the PR/workflow artifacts.
Artifact retention alone is not permanent proof.

~~~markdown
## Acceptance report
- Milestone/phase:
- PR and tested commit SHA:
- Status: Passed / Failed / Incomplete
- Implementation type: AI
- Implementation author: Codex Cloud
- Independent reviewer and review status:

| Requirement ID | Outcome | Evidence |
| --- | --- | --- |
| A1 (example) | Passed / Failed / Not run | Command, workflow/job URL, result |

### Validation
- Exact commands; test counts; failures/skips:
- CI runs and checked commit:
- Coverage: frontend/backend lines and branches, scope/exclusions:
- Security checks and advisory-data status:
- Windows compatibility:
- Screenshots: relevant application states with captions, or Not applicable and why.

### Policy and risks
- Policy changes and rationale:
- Unresolved risks, blockers, exceptions, and expiry:
- Owner actions still required:
- Recommended next phase (not authorization to start it):
~~~

For actual PR attribution, keep exactly one standalone Implementation type field
outside code fences, following docs/pr-attribution.md. The fenced template above
is an example, not live PR metadata. Do not duplicate conflicting attribution
fields when incorporating the report into the existing PR template.

Screenshots should use synthetic data and show relevant behavior; they supplement
automated evidence. Infrastructure-only changes may state Not applicable with a
reason. Never claim tests or CI passed without verifying their actual results.

## Risks, tradeoffs, and deferred milestones

- Coverage is an execution metric, not proof of assertions or specification quality.
  Prefer behavioral tests; changed-line coverage and targeted mutation testing can
  follow after the foundation is reliable.
- Advisory services and hosted runner images change. Record versions, failures,
  exceptions, and actual results rather than claiming perfect reproducibility.
- Keep Chromium and Linux as the full validation path initially; Windows gets
  targeted compatibility coverage. Expand matrices only for demonstrated needs.
- Human policy review remains necessary in M0. The product owner may designate a
  qualified human reviewer; the attribution label is not a substitute.
- Account ownership/visibility changes can affect access and cost. No plan document
  grants authority to make them.
- Keep SQLite for development; design migrations, authentication, authorization,
  and deployment protections before shared production use.

Subsequent milestones:
1. Specification-driven development with stable criterion IDs and independent AI
   review, using separately controlled credentials and evaluation on seeded defects.
2. Independently maintained acceptance/contract tests and targeted mutation testing.
3. Asynchronous orchestration with durable GitHub records, idempotent events,
   commit/spec/policy version tracking, bounded retries, budgets, and escalation.
4. Controlled automatic merging/merge queues and delivery only after validation
   effectiveness is measured; add merge_group checks if introducing a merge queue.

## Phase A assignment for a fresh chat

> Implement Milestone 0 Phase A in Johnson-Dev-Agent-Management/project-manager
> from current main. Read AGENTS.md and docs/milestones/milestone-0.md. Preserve
> Windows compatibility, implement only Phase A, and measure coverage without
> enforcing new thresholds. Use a single implementation agent. Validate the
> workflow and open an AI-authored draft PR with the standard acceptance report.
> This authorizes Phase A implementation and CI runs within existing approved
> spending limits. Explicitly report proposed changes to protected policy.
> Do not merge, alter GitHub permissions/protections, purchase services, or begin
> Phases B/C.

The owner must issue this assignment explicitly; its presence in this document
is not execution authorization.

## Supporting references

- [Agent instructions](../../AGENTS.md)
- [PR attribution and live verification](../pr-attribution.md)
- [Cloud setup](../cloud-setup.md) — revalidate historical environment claims.
- [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Secure GitHub Actions use](https://docs.github.com/en/actions/reference/security/secure-use)
- [ASP.NET Core integration testing](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Vitest coverage](https://vitest.dev/guide/coverage.html)
