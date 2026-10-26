# Manual automation-account setup — Phase C

Status: **Owner-selected approach; not connected or verified.**
Use a dedicated GitHub automation account, outside collaborator with **Write**
on `Johnson-Dev-Agent-Management/project-manager` only. No organization membership,
Admin/Maintain role, bypass, or access to `Joshbomb75` credentials. `Joshbomb75`
remains human reviewer and merger. The repository is intentionally public;
the cloud development environment stays private. All steps that create accounts,
invite collaborators, change access/connections or spend money are manual owner
actions. The agent has performed none of them.

## What support is verified

Reviewed official documentation and current connection metadata during Phase C:

| Claim                                                                  | Evidence / status                                                                                                                                                                      |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex Cloud supports connected GitHub repositories and pushing changes | [OpenAI Codex Cloud](https://help.openai.com/en/articles/20001545-using-codex-cloud); repository permission and task Git setup are separate requirements                               |
| Provider account selection/reconnection exists                         | [OpenAI connection guide](https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt); exact UI and multi-account availability depend on app/surface |
| This task can push branches and create draft PRs                       | Existing branch push and PR #15 verified under **Joshbomb75**, not the proposed automation account                                                                                     |
| Automation outside collaborator works for both paths here              | **Unverified until the new identity passes the separate Git/API/PR checks below**; generic product documentation is insufficient                                                       |
| Owner credentials are unavailable through all agent routes             | **Unverified / not satisfied**: current connector still identifies as Joshbomb75; no enforcement work may start                                                                        |

Current connector inspection lists only the owner user and organization app
installations, both with repository selection `all`; no automation account is
present. This describes installation selection, not the effective token's scopes
or a complete inventory of credentials. Do not silently narrow shared installations
that other tasks depend on. Any necessary installation-selection change is for
the owner to review and perform, and must leave implementation access scoped to
this repository. The general ChatGPT GitHub research app's documented read access
does not establish Codex write support; use the Codex-enabled connection actually
exposing Git/PR operations, and test it.

In this documentation follow-up, ordinary `git push origin codex/m0-phase-c`
failed with **could not read Username for https://github.com**. The connector
still returned `Joshbomb75` afterward. The earlier push is historical support
evidence; the present Git credential path is not working and has not been
reauthenticated. No owner credential was added/recovered. Publishing this
authorized documentation through the existing connector does not verify Git
push support or credential separation for the future automation account.

## Manual steps and stop points

1. **Check billing before inviting.** GitHub's [license rules](https://docs.github.com/en/billing/reference/github-license-users)
   charge for outside collaborators on private/internal repositories; public-only
   access is expected not to add a paid seat. Check the organization plan and
   current seat/usage totals in owner Billing and licensing, then review the
   repository invitation preview. Invite by exact username, not email. Stop at
   any charge, paid-seat increase, membership invitation or upsell; obtain separate
   cost approval before proceeding. Organization billing has not been inspected
   by the agent. Existing CI/ChatGPT usage limits remain in force.
2. **Create the account yourself** using GitHub's free personal-account signup
   in a separate browser profile. Use a distinct username and account email, a
   unique password, and 2FA/passkey. Keep recovery codes, passwords and personal
   owner sessions outside the agent environment. Do not create an organization,
   start a trial, buy a plan, or add this account to any organization/team. Send
   only its public username when ready; never send credentials.
3. **Preflight the native connection UI before invitation.** In the ChatGPT/Codex
   surface used for these cloud tasks, inspect Settings → Plugins → GitHub (or
   the shown Connections/Apps equivalent). Confirm that the Codex connection can
   select/reconnect to the new GitHub account. Review provider consent, including
   workflow-file write capability; it must not require the automation account
   to become an organization member/admin. If the wrong account is silently
   reused, a write-capable connection is unavailable, or additional OpenAI seats
   are requested, stop and report the exact UI message without secrets. Do not
   use a research-only connection as evidence of write support.
4. **After the billing and UI checks**, in the owner-controlled GitHub session
   open this repository → Settings → Collaborators and teams / Manage access →
   Add people. Invite the new username as an **outside collaborator, Write**.
   Use the repository access screen, not organization membership. Accept from
   the automation account's separate profile. Then verify that organization
   People lists it only under Outside collaborators and this repository role is
   Write, with no team, organization membership, extra repository grants or bypass.
   Recheck billing after acceptance. No agent invitation is authorized.
5. **Connect the automation identity for API and cloud Git.** Complete the native
   Codex-enabled GitHub authorization as that account; keep `Joshbomb75` in the
   owner's separate browser profile. Retain only this repository's approved
   implementation access. An outside collaborator cannot install/manage an org
   app as an owner: if installation approval is needed, the owner handles it in
   a separate session without connecting their owner identity to the agent.
   Review the cloud environment's repository connection separately; reconnecting
   the plugin alone does not prove that injected Git authentication changed.
6. **Remove owner routes before verification.** Manually disconnect/deselect
   owner-capable connections from the implementation context, including other
   GitHub accounts, workspace-shared connections, owner PAT/SSH credentials,
   stored Git/CLI helpers, environment/setup secrets and prepared VM state.
   Simply choosing a default automation connection while the owner connection
   remains callable is insufficient. Do not grant the automation account access
   to the owner's session, password manager, vault, personal files or computer.
   Preserve the owner's independent browser access for reviews/configuration.
   If the platform cannot isolate owner connections in this context, stop and
   ask OpenAI Support about supported isolation; do not claim C2 passed.
7. **Start a fresh cloud task from the committed preparation branch** with only
   the automation connection selected. Existing tasks may retain old state;
   [OpenAI documents](https://help.openai.com/en/articles/20001545-using-codex-cloud)
   that published environment changes apply to new tasks. No new paid environment
   or separate ChatGPT subscription is assumed or authorized.
8. **Run the bounded capability verification below**, then recreate PR #15 under
   the verified automation identity for `Joshbomb75` to review independently.
   Do not close the historical draft before the replacement is confirmed. No
   settings/probes may start until all checklist prerequisites are satisfied;
   the owner applies settings and supplies readback, not the agent.

## Minimum credential capabilities (verify, do not silently grant)

Repository Write is needed to propose code/workflow changes on unprotected feature
branches. It also permits merging in GitHub absent protection, so Write alone is
not a no-merge boundary: the owner-only protected-branch restriction is essential.
The implementation agent remains prohibited from merging throughout setup.

For a native GitHub App **user** connection, verify that API/PR author is the
automation account; an installation-bot author does not prove the selected
account path. Desired capabilities are contents read/write, pull requests
read/write, workflow-file write, Actions read and check/status read, plus metadata
read. Push/PR-triggered CI needs no manual dispatch permission. Actions write is
needed only for approved dispatch/rerun/cancel operations or if fixed native-app
consent requires it; document that extra capability explicitly. Native app bundles
may also require issues write for labels. Inspect actual consent and effective
permissions; this table is not proof that the app allows custom permission tuning.
Never add administration, organization management or protection bypass to fix a
connection failure. User and app permissions jointly bound access.

GitHub's current [PAT limitations](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
exclude outside-collaborator contributions with fine-grained PATs. Do not attempt
to fix that by making the automation account an organization member. A classic
PAT is **not approved as a fallback here**: for public code the relevant baseline
is `public_repo` plus `workflow` for workflow-file edits, but classic tokens cannot
be pinned to one repository and have broader capabilities. See [scope definitions](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).
If native connection fails, report it and obtain a separately reviewed credential
plan instead of generating/injecting tokens. No token values belong in evidence.

## Capability and separation evidence to collect

Use only an ordinary `codex/m0-phase-c-identity-check` branch and AI-authored draft
PR to main for harmless documentation/workflow-comment changes, or the replacement
preparation PR once authorized setup is ready. These are capability checks, not
deliberate-defect/protected-target probes. Never test a protected ref or merge.

| Capability                    | Required observation                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API identity                  | `get_user_login` and, where supported, cloud `gh api user` return the automation username and numeric ID, never Joshbomb75                                                                              |
| Git push identity             | Successful ordinary feature-branch push plus remote push actor from owner-visible GitHub activity/audit evidence; Git commit author/email or public fetch alone is insufficient                         |
| Workflow-file access          | Push a harmless workflow comment on an unprotected source branch and inspect the exact workflow diff/SHA; changing no workflow file cannot prove this permission                                        |
| PR authorship                 | Actual draft PR `user.login` equals the automation username; AI-authored attribution/label verified separately                                                                                          |
| CI capability                 | Push/PR CI runs for the exact SHA; agent can read jobs/logs/artifacts. Record separate availability of approved rerun/dispatch/cancel operations without granting extra scope just to test              |
| Repository authorization      | Collaborator permission Write/push; admin=false and maintain=false; owner confirms outside-collaborator status, no org membership/other repo grants and no bypass                                       |
| Owner credentials unavailable | Owner verifies connection/secret inventory; fresh task enumerates only approved routes using non-secret metadata and checks every callable GitHub path. A denied admin read alone is insufficient proof |

Record UTC observation times, identity IDs, source/head/tested merge SHAs, PR and
CI links, permissions/consent evidence and unknown fields. Redact sensitive data.
Until both identity paths and owner-credential absence are established, C2 and
end-to-end account support remain **Unverified**, and Phase C remains incomplete.
