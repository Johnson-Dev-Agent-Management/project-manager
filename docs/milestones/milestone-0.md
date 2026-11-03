# Milestone 0 — Supervised development foundation

## Status and purpose

**For routine work:** follow [AGENTS.md](../../AGENTS.md),
[engineering standards](../engineering.md), and the [CI validation matrix](../ci.md#local-and-hosted-validation).
This completed milestone retains its historical assessment, phase tasks, criteria,
and assignment example for traceability. They are not recurring feature requirements;
in particular, Phase A's no-floor instruction does not override today's enforced floors.
Routine PRs use the concise PR template, not the full milestone report below.

On November 2, 2026 (America/Los_Angeles), the owner approved a bounded,
CI-focused closeout and instructed the agent to proceed. M0's goal is a reliable
pipeline for supervised application development: required CI, meaningful tests,
coverage floors, representative regression detection, and human policy review.
Account-isolation certification and exhaustive adversarial enforcement probes are
deferred. They are not prerequisites to a bot-authored closeout PR or M0 acceptance.
This changes acceptance scope; it does not claim the deferred controls passed.

The current Phase C criteria below supersede earlier C1–C6 interpretations and
identity prerequisites in historical Phase C reports, probe ledgers and account
setup instructions. Phase A/B checks and their coverage/security requirements
remain intact. See the [closeout report](milestone-0-closeout-report.md) for current
evidence and the [owner handoff](milestone-0-phase-c-owner-handoff.md) for remaining
actions. PR #16 is owner-approved and merged; all seven jobs pass on resulting
main `0e6b05f350b5f2a5b90b07414e8e113093d80360`. The implementation is ready for
supervised feature development. The owner subsequently supplied the current
protection export, confirming the required review/up-to-date settings and
code-owner review configuration. **M0 is complete for the revised supervised
scope**; the report retains the evidence source and limits. Credential-isolation
certification and exhaustive adversarial probes remain deferred.

The owner retains merges, releases, deployments, purchases, visibility changes,
and GitHub permission/configuration changes. Implementation uses the existing
codexcodemachine connection for publication; the agent never submits the human
review or approval. No account/credential changes or bypasses are needed for this
closeout. Preserve existing stronger protections. Product features begin in the
next assigned task after closeout, not as part of this implementation.

## Repository assessment and evidence limits

Historical planning snapshot; current commands, controls, and evidence are linked above.

Planning baseline: main at
[653ade674f81f90598f4dd92894705834ca007ed](https://github.com/Johnson-Dev-Agent-Management/project-manager/tree/653ade674f81f90598f4dd92894705834ca007ed).
Reinspect current main at the beginning of each phase.

| Area              | Baseline and implications                                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ownership         | The repository is intentionally public and organization-owned (owner confirmed during Phase C). Keep the cloud development environment private. The owner reports GitHub Team; actual billing and effective settings still require owner verification. |
| Bootstrap         | The cloud scaffold is merged. Use current main, not the historical codex/cloud-bootstrap branch.                                                                                                                                                       |
| Frontend          | React, strict TypeScript, Vite, ESLint, Vitest, React Testing Library, jest-dom, and jsdom already exist. Preserve the frameworks.                                                                                                                     |
| Backend           | ASP.NET Core targeting .NET 10, EF Core, SQLite, xUnit, and WebApplicationFactory already exist. Existing backend tests are integration tests.                                                                                                         |
| Toolchain         | Node and .NET SDK versions are pinned in .nvmrc and global.json. npm and NuGet locks are committed. Record and consistently use the tested npm version as well.                                                                                        |
| Behavior          | Creation/listing, trimming, invalid-name rejection, and persistence are implemented. Playwright exercises creation, validation, reload, and API restart in two phases.                                                                                 |
| Commands          | scripts/setup.sh, check.sh, dev.sh, and e2e.sh exist. Windows shell handling has been added, but non-Windows paths still assume /workspace.                                                                                                            |
| Attribution       | A PR template, metadata-only attribution workflow, attribution documentation, and Python attribution tests exist. The label is spelled AI-authored.                                                                                                    |
| CI and protection | At planning inspection, only the attribution workflow existed; the Actions API returned zero runs, main was unprotected, and the rulesets API returned an empty list. This does not establish whether Actions is enabled.                              |
| Coverage          | No measured, accepted coverage baseline or enforced coverage targets have been established.                                                                                                                                                            |
| Production        | Authentication, authorization, deployment, and migration-based schema management remain outside this milestone.                                                                                                                                        |

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
- Produce an understandable acceptance report for every M0 phase and implementation PR.

Do not add product features, independent AI review, agent orchestration, automatic
merging, deployment infrastructure, or a broad architectural rewrite in M0.

## Owner decisions and configuration boundaries

The timing column records M0 setup decisions, not prerequisites to repeat for each
feature. Standing authorization/publication rules are in AGENTS.md; the closeout
report records completed verification and the current exception register.

| Decision/action                      | Recommended direction                                                                                                                                                                                         | Timing and evidence                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| GitHub plan and ownership            | Preserve the intentionally public organization repository and private cloud environment; verify effective protection eligibility.                                                                             | Confirm before Phase C acceptance. Record effective settings, not just the subscription name.                                      |
| Implementation and review identities | Owner chose a dedicated automation account as an outside collaborator, Write on this repository only, no organization membership; Joshbomb75 reviews and merges.                                              | Verify the bot API identity and actual PR author; retain genuine human review. Git-route/isolation certification is deferred.      |
| Credential separation                | Full credential isolation is deferred; use the bot for publication and retain genuine human review.                                                                                                           | API identity identifies PR authorship; no complete credential-isolation claim is made.                                             |
| Account/installation cost            | Public-repository-only outside collaboration is expected not to consume an additional paid GitHub seat; owner checks actual billing before inviting. No additional ChatGPT plan or seat is assumed necessary. | Owner performs account/connection setup manually; any expense requires separate approval.                                          |
| Actions and budget                   | Permit required workflows on hosted runners, use restricted token defaults, and approve a spending/usage limit.                                                                                               | Before Phase A CI execution; do not broaden settings or buy credits implicitly.                                                    |
| Policy owner                         | Designate a human reviewer for CI, tests, thresholds, standards, and associated scripts.                                                                                                                      | Identify before implementation; enforce in Phase C.                                                                                |
| Merge controls                       | Owner-controlled merging, required checks/reviews, no implementation-agent bypass.                                                                                                                            | Activate and verify in Phase C.                                                                                                    |
| Visibility                           | Public source visibility is intentional; cloud environment remains private.                                                                                                                                   | No visibility change is needed or authorized. Public code does not authorize public development services or access to credentials. |

Attribution and authentication are separate. AI-authored identifies the declared
implementer; it cannot prove a separate PR author, an independent approval, or
successful validation. A PR author cannot approve their own PR merely by switching
sessions. If a PR is owner-authored, use another qualified reviewer or an explicitly
authorized distinct contribution identity; do not bypass approval rules.

Document unresolved identity questions as deferred work. CI success alone does
not prove server-side merge blocking; verify required checks and review settings
under the revised Phase C criteria without requiring account-isolation certification.

Use **codexcodemachine** for implementation publication and PR authorship. The
owner supplies genuine human review and any merge. Existing owner read-only
verification remains permissible; merely exposing that connection is not an M0
blocker under the revised scope. No fresh isolated context, Git capability probe,
account removal or protected test target is required before the replacement PR.
Follow the [current handoff](milestone-0-phase-c-owner-handoff.md); do not change
roles, memberships, credential permissions, costs, visibility or protections.

## Phase A — Foundational CI

Completed milestone implementation record; do not rerun these tasks for routine work.

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
  fail; diagnostics remain available. The revised C scope uses representative detection evidence; full permission probes are deferred.
- A6: Reports identify the exact commit and distinguish Passed, Failed, and Not run.
  Infrastructure limitations are recorded rather than presented as passing tests.

An independent human verifies workflow links, the tested SHA, reports, and the
controlled failure. Local success alone does not satisfy A. This phase does not
claim required-check enforcement.

## Phase B — Testing and security hardening

Completed milestone implementation record. At implementation time this depended
on accepted Phase A and authorization for B. Its implemented checks remain in force.

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

For current work, use the [handoff states](../engineering.md#handoff-states): draft
prepared, validated and awaiting human review, human accepted, and owner merged.
Independent approval remains required for acceptance; agents may hand off accurately
reported work while review is pending. Owner merging is a separate action.

## Phase C — Bounded CI closeout

Completed milestone implementation record. The revised criteria document accepted
scope; publication replacement, protection readback, and regression exercises below
are not recurring assignments for feature PRs.

### Scope and ordered tasks

1. Preserve PR #15's current implementation, including the Node/npm
   setup correction, all seven CI jobs, independent 80% line/70% branch floors,
   report/discovery safeguards, real SQLite tests and production-output E2E.
2. Resolve only the ten historical artifact-hash false positives using their exact
   commit/path/rule/line fingerprints. Verify against original artifact bytes,
   retain full-history and tracked-tree scanning, and record authorization,
   reviewer, expiry and retest instructions. Triage moderate npm findings;
   retain blocking high/critical findings and unavailable advisory data.
3. Use an existing bot connection to open a replacement draft PR, allowing the
   owner to supply a genuine human review. Preserve #15 until replacement content
   is confirmed. No Git push identity certification, connector removal or new
   credential setup is required. API publication is an acceptable contribution path.
4. Confirm main requires PRs, all seven checks from GitHub Actions (App 15368),
   up-to-date validation, and human/code-owner review. Retain stale/latest-push
   review, conversation resolution, force/deletion blocking and existing stronger
   protections. Install `* @Joshbomb75` CODEOWNERS through the reviewed bootstrap;
   verify its effect on the actual base after owner merge. If detailed readback is
   unavailable, use one current owner export or GitHub settings capture.
5. Run the representative exercises below; do not create/modify protected targets
   or run destructive/bypass probes. Distinguish test detection, aggregate behavior
   and GitHub enforcement evidence. Draft status or an unrelated failure is not
   proof that the intended check blocks a merge.
6. Obtain exact-head green CI and human review. After owner merge, verify all seven
   checks on the resulting main commit and accept the concise closeout report.
   Refresh the private cloud baseline for subsequent application work.

### Representative regression evidence

| Exercise                                      | Required evidence                                                                                                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Failed frontend assertion                     | Real test invocation exits nonzero and identifies the failed assertion.                                                                                                     |
| Application behavior regression               | Temporarily break validation or persistence; unchanged behavioral tests reject it. Restore source and revalidate.                                                           |
| Coverage below floor                          | Existing fixtures verify line and branch thresholds independently for both report paths; no rounding up or omitted production files.                                        |
| Required job failed/cancelled/skipped/missing | Existing tests execute the workflow's actual aggregate code for every dependency/outcome; hosted failed dependency also fails quality-gate.                                 |
| Valid final change                            | Every named hosted job explicitly succeeds at the final PR head.                                                                                                            |
| Merge enforcement                             | Current required-check/review configuration, plus a ready PR's GitHub merge evaluation where available. Missing settings remain Unverified, not inferred from draft status. |

Local defect exercises are temporary and never published or merged. Reuse the
existing tests rather than duplicate them. The prior exhaustive ledger remains
historical/deferred; no direct-push, force-push, deletion, spoofed-status,
credential-isolation or protected-target advancement probes are M0 blockers.

### Revised Phase C acceptance criteria

- C1: Main's required PR/check/review settings are confirmed; all seven required
  checks are bound to GitHub Actions and validate against the current base.
- C2: A bot-authored PR permits genuine owner review; the agent does not approve
  or merge it. Full account isolation and bypass certification are deferred.
- C3: Existing checks/thresholds remain intact, CODEOWNERS is included and reviewed,
  and its base-branch effect is verified after bootstrap merge.
- C4: The bounded regression exercises above have traceable results. Detection
  and actual server-side enforcement are reported separately.
- C5: Scanner false positives and dependency triage have narrow, documented
  dispositions; recovery/exception instructions remain usable.
- C6: The owner reviews/accepts the closeout and the resulting main run is green.

Completion means a supervised CI foundation. It does not certify isolation from
owner credentials, adversarial workflow resistance, automatic merging or deployment.

## Standard acceptance report

Use this report for assigned milestone implementation and phase handoffs. Routine
feature, fix, and documentation PRs follow [PR evidence and handoff](../engineering.md#pr-evidence-and-handoff)
and the existing PR template; no requirement-ID table or next-phase recommendation
is needed. For milestone work, extend that template and retain its exact attribution fields. Store durable milestone
evidence in the repository when appropriate and link the PR/workflow artifacts.
Artifact retention alone is not permanent proof.

```markdown
## Acceptance report

- Milestone/phase:
- PR and tested commit SHA:
- Status: Passed / Failed / Incomplete
- Implementation type: AI
- Implementation author: Codex Cloud
- Independent reviewer and review status:

| Requirement ID | Outcome                   | Evidence                          |
| -------------- | ------------------------- | --------------------------------- |
| A1 (example)   | Passed / Failed / Not run | Command, workflow/job URL, result |

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
```

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

Historical assignment example for the completed phase, not a current task or startup checklist.

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
