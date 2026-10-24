# Agent instructions

## Project
A project management application built with React, TypeScript, C#, and ASP.NET Core.
Development is performed by coding agents in a private Codex Cloud environment.
The cloud-tested baseline creates and lists projects through React and ASP.NET Core,
with SQLite persistence and automated unit and browser tests.

## Scope and authorization
- Work only on Johnson-Dev-Agent-Management/project-manager and its development dependencies.
- Run builds, tests, dependency installation, and development services in the cloud.
  Do not use the owner's personal computer, files, browser sessions, or local services for project execution.
- Within an assigned task, implement changes, install necessary project dependencies,
  run checks, commit, push a feature branch, and open or update a draft pull request.
- Leave merges, releases, deployments, purchases, paid credits, and new paid services to the owner.
- Keep the repository and development environment private. Do not broaden repository or service access.
- Use synthetic development data. Never commit credentials, database files, or environment secrets.
- These instructions guide behavior; actual access controls must be enforced in the environment and GitHub.

## Milestone planning
- Before milestone work, read [Milestone 0: Trusted Development Foundation](docs/milestones/milestone-0.md).
- Follow the assigned phase, its acceptance criteria, and the acceptance-report format.
  The plan is not authorization to start another phase, merge, or change GitHub settings.
- Treat CI configuration, test definitions, coverage thresholds, and engineering standards
  as protected policy. Explicitly identify proposed changes; never silently weaken controls.

## Architecture
- One repository: `src/web/` for React + strict TypeScript + Vite;
  `src/api/ProjectManager.Api/` for ASP.NET Core; `tests/` for backend tests.
- Use .NET 10 LTS and Node.js 24 LTS, current supported patches.
  Record the exact tested SDK/tool versions, commit package-lock.json and NuGet lock files.
- Start with EF Core and SQLite for development. No external database account is required.
- Keep the API and UI small and modular. Prefer a modular monolith to services.
- Use server-side validation and consistent error responses. Use accessible labeled controls,
  loading/empty/error states, and strict TypeScript without suppressing meaningful diagnostics.
- Default development listeners to loopback. Do not expose an unauthenticated development app publicly.
- Authentication, authorization, and deployment are separate features and must be implemented
  before using real user data or offering shared/public access.

## Required developer commands
The following root-level Bash entry points are implemented and passed cloud validation.

- `bash scripts/setup.sh`: restore pinned frontend and backend dependencies;
  prepare development-only data/configuration; safe to rerun.
- `bash scripts/check.sh`: lint, type-check, build, frontend tests, backend tests;
  propagate failures with a nonzero exit status.
- `bash scripts/dev.sh`: start frontend and backend on documented loopback ports;
  clean up child processes on exit.
- `bash scripts/e2e.sh`: start isolated test services and a temporary SQLite database,
  run the UI-to-API persistence scenario, and clean up only test-owned processes/files.
  Prefer a headless browser test when the environment supports it. If unavailable,
  report the exact limitation; do not describe API-only checks as browser E2E tests.

Record the underlying npm/dotnet commands and actual results in README.md.
Keep setup independent of personal credentials. Use npm ci and locked NuGet restore
after generating and committing lock files. Update locks intentionally when changing dependencies.
Run relevant tests for a change and the complete check script before handing off a PR.

## Git workflow
- Read the current repository state and any task-specific instructions first.
- Start from the owner's specified branch or the latest main. The initial cloud-bootstrap
  branch has been merged; do not use that historical branch as the default baseline.
- Work on a codex/<short-task-name> feature branch. Never force-push shared branches.
- Keep one coherent draft PR per task. Explain the behavior, validation, and limitations.
- Preserve existing work and the Apache license. Do not merge your own PR.
- If parallel agents are explicitly requested, give each agent an independent branch/worktree
  and clearly bounded ownership; coordinate overlapping files before integration.

## Pull Request Attribution and Documentation
- These conventions apply to all future PRs unless explicitly overridden by the user.
  Preserve the existing draft PR workflow and GitHub authentication/ownership.
- Identify AI-authored PRs explicitly. When Codex creates a PR for changes primarily
  implemented by an AI agent, use `.github/pull_request_template.md` and include
  these exact structured lines (replace the author with the actual agent if different):

  ```text
  Implementation type: AI
  Implementation author: Codex Cloud
  ```

- Apply the `AI-authored` GitHub label when permissions and tooling permit, and verify
  that it was applied. Its description is "Changes primarily implemented by an AI coding agent."
  Report unavailable tooling or denied permissions instead of claiming success.
- Include a concise summary, the relevant milestone or issue (or explicitly state
  none), tests performed, and known limitations or follow-up work. Distinguish
  **Passed**, **Failed**, and **Not run** validation, including commands and reasons
  where relevant. Never claim checks passed unless their results were actually verified.
- Human-authored PRs use `Implementation type: Human` and `Implementation author: Human`.
  Never infer implementation authorship from the GitHub account opening the PR,
  and never automatically label human-authored PRs as `AI-authored`.
- `.github/workflows/pr-attribution.yml` provides automatic labeling from the
  structured type field after it is merged into the default branch and GitHub
  Actions is enabled. It handles opened, edited, and reopened PRs, including drafts
  and forks; it creates or corrects the label description when processing an AI PR.
  It reads PR metadata only, with `pull-requests: write`, and never checks out or
  executes PR code. Do not add untrusted code execution to this privileged workflow.
- Attribution remains self-declared: keep exactly one type field and name the actual
  implementer. Automation only adds labels; if attribution is corrected to Human,
  remove an incorrect `AI-authored` label manually. If automation is unavailable,
  a maintainer must create/apply the label. See `docs/pr-attribution.md` for setup
  and verification steps; do not change repository-wide security settings to enable it.

## Baseline end-to-end acceptance criteria
Preserve these verified behaviors:
1. A user enters a nonblank project name in the React interface.
2. ASP.NET Core validates and persists the project in SQLite.
3. The project appears in the list and remains after a page reload and API restart.
4. Invalid and whitespace-only names are rejected server-side with a useful UI error.
5. Automated backend and frontend tests cover success and validation failure.
6. Execute an end-to-end check in the cloud and record exact commands and results.

The definition of done is tested code plus a draft PR and accurate instructions.
A submitted task, a running environment, or unexecuted tests are not proof of success.
