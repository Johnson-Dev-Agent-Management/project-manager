# Agent instructions

## Project
A project management application built with React, TypeScript, C#, and ASP.NET Core.
Development is performed by coding agents in a private Codex Cloud environment.
The cloud-tested baseline creates and lists projects through React and ASP.NET Core,
with SQLite persistence and automated unit and browser tests.

## Scope and authorization
- Work only on Joshbomb75/project-manager and its development dependencies.
- Run builds, tests, dependency installation, and development services in the cloud.
  Do not use the owner's personal computer, files, browser sessions, or local services for project execution.
- Within an assigned task, implement changes, install necessary project dependencies,
  run checks, commit, push a feature branch, and open or update a draft pull request.
- Leave merges, releases, deployments, purchases, paid credits, and new paid services to the owner.
- Keep the repository and development environment private. Do not broaden repository or service access.
- Use synthetic development data. Never commit credentials, database files, or environment secrets.
- These instructions guide behavior; actual access controls must be enforced in the environment and GitHub.

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
- Start from the owner's specified branch or the latest main. For the initial cloud setup,
  use codex/cloud-bootstrap so these instructions are present before the owner merges the PR.
- Work on a codex/<short-task-name> feature branch. Never force-push shared branches.
- Keep one coherent draft PR per task. Explain the behavior, validation, and limitations.
- Preserve existing work and the Apache license. Do not merge your own PR.
- If parallel agents are explicitly requested, give each agent an independent branch/worktree
  and clearly bounded ownership; coordinate overlapping files before integration.

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
