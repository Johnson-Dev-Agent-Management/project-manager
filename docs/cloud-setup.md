# Private Codex Cloud setup

## Status
Bootstrap instructions are prepared. The cloud environment, runtime installation,
application scaffold, and test results are not yet verified.
Update this section with evidence when those steps are complete.

## Environment configuration
- Repository: Joshbomb75/project-manager only.
- Initial setup branch: codex/cloud-bootstrap. Until the owner merges the bootstrap
  PR, explicitly check out this branch during setup.
- Environment name: project-manager-dev.
- Privacy / Who can use: Only me.
- Execution: Codex Cloud; no local computer access.
- Billing: existing ChatGPT Plus included usage. Do not enable paid extras, automatic
  credit purchases, billable services, or larger paid machines without owner approval.
- Runtimes: supported patches of .NET SDK 10 LTS and Node.js 24 LTS.
- Development database: SQLite file inside the cloud workspace; no external credentials.
- Secrets: none required for the initial scaffold.

Create the environment through Work in > Cloud > Select environment > Create environment,
or Settings > Codex Cloud > Environments. Select only this repository. GitHub connection
installation access should be restricted to this repository where the connection supports it.
Existing connector access is separate from the environment's selected repository list.

## Network and approvals
Start with restricted internet access and package-manager destinations.
Permit only the registries, official runtime download hosts, and GitHub endpoints that
the actual setup requires. Review redirects before expanding the allowlist.
Do not select unrestricted internet or local/private network access to fix a failed download.
Record the tested domain allowlist here after setup.

Use cloud-supported permissions for normal development operations. If automatic review
is offered, it can reduce interruptions, but it is not an isolation guarantee and
does not guarantee that every action will proceed unattended. Report blocked steps.
Do not disable security controls or switch execution to the owner's computer.

Do not enable GitHub Actions execution or other external CI billing as a workaround for
cloud validation. Add CI only after its included allowance and spending controls are verified.

## Setup and publish
1. Verify the checkout and read AGENTS.md on codex/cloud-bootstrap.
2. Scaffold the app and validation scripts described there, using official tooling.
3. Pin tested versions and commit dependency lock files.
4. Run setup, lint, type-checks, builds, frontend tests, backend tests, and E2E checks.
5. Record actual runtime versions, commands, outcomes, and any limitations in README.md.
6. Configure the environment install script to run bash scripts/setup.sh.
   Configure startup instructions to run bash scripts/dev.sh and check service readiness.
7. Inspect the setup report. Save and publish the private environment once setup passes.
8. Start a fresh cloud task to confirm the published environment can restore and run
   the project without relying on files or processes from the setup session.
9. Commit and push the feature branch; open or update a draft PR. The owner merges it.

Publishing a development environment is distinct from deploying the application.
Do not deploy the application during this setup.

## Verification checklist
- [ ] Repository is private.
- [ ] GitHub installation scope reviewed; only intended repository access granted.
- [ ] Environment contains only Joshbomb75/project-manager and is private.
- [ ] No local computer access, production secrets, or paid extras.
- [ ] .NET and Node versions pinned and recorded.
- [ ] Dependency restore succeeds from committed lock files.
- [ ] Build, lint, type-checks, frontend tests, and backend tests pass.
- [ ] UI creates a project through the API and persistence survives reload/restart.
- [ ] E2E validation executed; browser limitations, if any, stated explicitly.
- [ ] Published environment verified in a fresh cloud task.
- [ ] Draft PR contains an accurate validation report.
- [ ] Owner can start another task and review its output.

## Assigning future work
Choose Work in > Cloud and project-manager-dev, then give a bounded task:

> In Joshbomb75/project-manager, implement [feature] from the latest main.
> Follow AGENTS.md. Acceptance criteria: [observable outcomes].
> Run relevant tests and bash scripts/check.sh, then push a feature branch and open
> a draft PR with results. Do not merge or deploy. Use included usage only.

Review the diff and the command/test evidence, request corrections in the same task,
then merge yourself when satisfied. After merging bootstrap or changing setup dependencies,
refresh/republish the reusable environment as needed and verify its starting branch.
Do not treat cloud VM storage as the permanent copy: commit important work to GitHub.

Official guide: https://learn.chatgpt.com/docs/environments/cloud-environments
