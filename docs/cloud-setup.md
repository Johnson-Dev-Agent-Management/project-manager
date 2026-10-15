# Private Codex Cloud setup

## Baseline verification
The private `project-manager-dev` environment was published and verified in a
fresh cloud task on 2026-10-07. The task fetched `codex/cloud-bootstrap` at
`5e7d0a2dca651c815f64ca3040ee056a1c9e46c8`, ran setup, checks and browser E2E,
and confirmed clean process shutdown and a clean working tree. All builds, lint,
strict type checking, 3 frontend tests, 4 backend tests and two browser phases passed.
The implementation commit is `7b5db5686c3ad313dfa3e2a4ef8f91260884174c`.
The current Node 24.22.0 upgrade passed setup twice, the complete check script,
and both browser E2E phases in the current task. See README.md for exact tested
tool versions and results; these results do not verify a republished environment.

## Access and billing
- Repository: private `Joshbomb75/project-manager`; PR #1 merged the baseline into `main`.
- Environment: `project-manager-dev`, repository selection contains only this repo,
  privacy is **Only me**.
- Project execution: Codex Cloud. No project builds, tests, installs or services run
  on the owner's personal computer.
- Development: cloud-local SQLite, synthetic data and loopback services only.
- No environment variables, network secrets or production credentials were added.
- Existing ChatGPT Plus included usage only. No paid extras, automatic credit
  purchases, deployments, external databases or GitHub Actions runs were enabled.
- **Remaining owner action:** the existing GitHub app installation currently covers
  all repositories. Environment selection does not narrow that installation.
  Restrict it to only `project-manager` at
  https://github.com/settings/installations/169120354 if that matches the owner's
  intended access for other chats. This has not been changed because it affects
  unrelated repositories.

## Network and approvals
The published environment uses **Custom domains only** with these exact entries:
`registry.npmjs.org`, `dot.net`, `builds.dotnet.microsoft.com`,
`api.nuget.org` and `github.com`. There are no proxy secrets.
The fresh cloud task restored locked dependencies and fetched the Git branch
without any dependency-domain denial. It inherited the published image's runtime
and caches; this confirms reuse, not a complete cache-empty machine bootstrap.

The pinned .NET installer avoids automatic channel lookup at `ci.dot.net`.
Browser tests use system Chromium, so no Playwright browser CDN is required.
The Node bootstrap uses the existing `registry.npmjs.org` allowance, so this
upgrade does not require broadening network access.
GitHub metadata is managed through the GitHub connector; cloud Git fetch/push
uses the platform HTTPS proxy.

The fresh task displayed **Approve for me** and completed ordinary validation
without owner approval prompts. Automatic review can still block an action;
it does not guarantee unattended execution of every command. Keep project
execution in the cloud and report blocked steps. Do not broaden access, disable
security controls, enable paid extras or switch to local execution.

## Install script
```bash
#!/usr/bin/env bash
set -Eeuo pipefail
cd /workspace/project-manager
bash scripts/setup.sh
```

## Persistent Node 24.22.0 configuration

`.nvmrc` is the source of the exact project Node version. The install script above
runs `scripts/setup.sh`, which installs `node@24.22.0` under `/workspace/.node`
when the image's Node version differs. All project entry points prepend this
runtime to PATH. npm stays at the image's version; application lockfiles are
unchanged. Setup can be rerun and also works with the older 24.19.0 bootstrap
runtime, so fresh sessions need not depend on a manually installed shell runtime.

The saved environment configuration and image have **not** been edited or
republished by this upgrade task: the available cloud tool reports status but
cannot change configuration. The owner still needs to:

1. Edit `project-manager-dev`; select Node **24.22.0** if the environment's runtime
   selector offers an exact version. Ensure its persistent install/setup command is
   the script above, run against a checkout containing this upgrade. Before the
   PR is merged, use `codex/node-24-22`; after merging, use latest `main`.
2. Save/apply the configuration and refresh or republish its prepared image using
   the environment UI. Preserve the existing private repository and network settings.
3. Start a fresh cloud task using the updated checkout and run setup, checks, and
   browser E2E. Confirm `bash -c 'source scripts/common.sh; node --version'`
   prints `v24.22.0`. Also check `node --version` in the fresh task. The project
   scripts use the pinned runtime even if the base image's default interactive
   `node` remains older; updating that default requires the environment's runtime
   selection or persistent PATH configuration.

These owner steps are required to verify the saved environment in a fresh task;
successful checks in the current task do not establish that it was republished.

## Development and validation
From `/workspace/project-manager`:
```bash
bash scripts/setup.sh
bash scripts/check.sh
bash scripts/dev.sh
# Separately; isolated test services and temporary SQLite:
bash scripts/e2e.sh
```

The API listens on loopback port 5000 and Vite on 5173. Check
`http://127.0.0.1:5000/api/health` and
`http://127.0.0.1:5173/api/projects`.
Restart services after snapshot restoration. Ctrl+C cleans up development
processes. E2E owns ports 5001/5174 and cleans up its services and temporary database.
Authentication and authorization must be implemented before shared/public use or real data.

## Assigning future work
Choose **New chat > Cloud > project-manager-dev**, then assign a bounded task:

> In Joshbomb75/project-manager, implement [feature] from latest main.
> Follow AGENTS.md. Acceptance criteria: [observable outcomes].
> Run relevant tests and bash scripts/check.sh, then push a feature branch and
> open a draft PR with test results. Do not merge or deploy. Use included usage only.

Review the PR diff and command/test evidence. Request corrections in the same
cloud chat, then merge yourself when satisfied. GitHub is the permanent copy:
commit important work rather than relying on cloud VM storage.

Baseline PR: https://github.com/Joshbomb75/project-manager/pull/1
Official guide: https://learn.chatgpt.com/docs/environments/cloud-environments
