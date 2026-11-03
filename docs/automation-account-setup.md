# Automation-account capabilities and isolation — Phase C

> Full account-isolation certification is deferred from M0 by the owner.
> This document remains optional future hardening guidance. Use the existing
> bot connection for publication and genuine human review under the
> [current milestone scope](milestones/milestone-0.md#phase-c--bounded-ci-closeout).
> Do not make isolation work a prerequisite to the bounded closeout.

Status: **API identity/Write verified; C2 owner-route exclusion Failed in this context.**
The account already exists and is connected. Do not recreate/invite it, change
roles/membership, spend money or broaden credentials. Preserve public repository
visibility and private cloud development.

## Current observations

Use the [fresh context readback](milestones/evidence/phase-c/fresh-context-readback.json)
and [ordered owner handoff](milestones/milestone-0-phase-c-owner-handoff.md) for the
current assignment. Earlier snapshots remain historical. Publication uses only
codexcodemachine. Latest owner steering authorizes an identified personal
connector for read-only verification. That selector subsequently appeared, and
expected Joshbomb75 identity was live-verified. Its detailed GET remains 403.
No owner write or unidentified Git/CLI credential is invoked.

| Item                          | Direct observation                                                                                                  | Limit                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Implementation API identity   | Codex GitHub authenticates codexcodemachine, ID 348095294                                                           | Does not identify Git transport credentials                                                                  |
| Repository authorization      | Collaborator write; push=true, admin=false, maintain=false                                                          | Role does not inventory complete scope/bypass exposure                                                       |
| Organization membership       | API reports []                                                                                                      | Repository-only grants, outside-collaborator status and billing are not independently established            |
| Owner administration identity | Live expected owner identity; Personal selector now exposed                                                         | Authorized read-only use only; protection GET still 403                                                      |
| Installation metadata         | The automation connection lists the organization installation; repository_selection=all, viewer_can_administer=null | Installation selection is not effective token scope                                                          |
| Owner route                   | Personal owner account is selectable and used for authorized read-only verification                                 | C2 owner-route exclusion Failed in this context; independent credential scope/bypass also remains Unverified |
| Cloud readiness               | No ready outbound identities, secret bindings or runtime variables                                                  | GH_TOKEN is present; value/identity/scope unknown and never inspected                                        |
| Git/API transport             | Historical public fetch/CLI denial; no verified codexcodemachine Git transport                                      | API host absent from enforced allowlist; authenticated Git push actor unknown                                |
| Current PR                    | #15 remains open/draft and Joshbomb75-authored; AI label description verified                                       | Updating its branch/body cannot change authenticated author                                                  |

The automation connector can read exact-head check/job metadata and decoded logs;
seven entry-run archives were downloaded and matched their API digests. The E2E
archive exceeds the executor transfer limit; its metadata and decoded ten-run log
are retained. Those are observed reads of existing CI, not isolated workflow-write
capability or new CI execution by the implementation identity. No feature-branch
capability probe runs before the isolation prerequisites hold.

Non-secret inventory is bounded: standard helper configuration and credential-file
presence were checked without reading credential files, environment values or
headers. Absence in those locations and a denied admin GET do not establish
absence of every owner-capable route. Never inspect secret values to diagnose it.

## Supported setup still required

Only codexcodemachine is authorized for publication in this continuation.
Owner-connector read-only verification is separately authorized if live-identified
and available; it subsequently became selectable and was live-identified. No new
chat was needed to select it. C2 requires a separate isolated implementation context.
The owner performs main administration in their separate session;
the [handoff](milestones/milestone-0-phase-c-owner-handoff.md) contains exact UI/CLI
steps and readback. Account Admin status does not add connector capabilities;
reconnecting the same managed connector cannot supply excluded administration.

Verify C2 in a **fresh isolated implementation context** using supported platform
configuration. Only approved codexcodemachine routes may be reachable there.
Exclude owner-capable connectors, shared connections, Git/CLI helpers, owner secrets
and retained VM state. Preserve the owner's separate human review/administration
access outside that context. Switching the selected/default account here is
insufficient. No isolation configuration or connection/permission change is made here.

Minimum implementation setup supplies a supported Git transport bound to
codexcodemachine and its API/PR connection, without owner routes. Inspect non-secret
consent/permission metadata and ready runtime bindings; verify actual authorization.
Do not grant administration, membership or bypass to repair an outside-collaborator
route. If isolation/workflow access is unsupported, report the exact limitation
for a separately reviewed setup decision. No new subscription is assumed.

General references are [Codex Cloud](https://help.openai.com/en/articles/20001545-using-codex-cloud)
and [connection management](https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt).
They describe product support, not verified setup here. Published environment
changes apply to new tasks; inspect readiness in the fresh context.

## Credential scope

Use this repository's approved outside-collaborator Write access. Desired
capabilities: contents read/write, PRs read/write, workflow-file write, Actions
read, checks/status read and metadata read. Native bundles may include issues
write for labeling; record actual consent instead of assuming individually tunable
permissions. Push/PR CI needs no dispatch permission. Do not add Actions write
for dispatch/rerun/cancel capability tests. No administration, organization
management, bypass or owner credentials.

Write alone permits merging absent protections. Verify the owner-only protected
update restriction retaining every PR/check/review requirement; never attempt a
protected update/merge to establish ordinary Write capability.

GitHub's [PAT limitations](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
exclude outside-collaborator contributions with fine-grained PATs. A classic PAT
is not an approved fallback: public_repo plus workflow is broader than one
repository. Do not mint/inject/expand tokens, change membership or alter shared
installations. Secret material never belongs in chat, files, commits or evidence.

## Bounded capability verification after prerequisites hold

First retain supported platform isolation evidence, a fresh credential-route
inventory, live API ID, Write/admin=false/maintain=false, reported memberships,
non-secret scope metadata and absence of implementation bypass. Until then,
the following remains **Not run / Unverified**.

Use only an ordinary unprotected **codex/m0-phase-c-identity-check** branch with
harmless documentation and a workflow comment. No protected refs, merges,
defect probes or administration bypass.

1. Verify each connection's live API identity before use; verify CLI identity
   through its supported route if used.
2. Make an actual Git push and retain result/exact remote SHA. Obtain independently
   observable remote push-actor evidence from GitHub activity or owner-visible
   audit evidence. Commit author/email, public fetch, API publication and CI actor
   alone do not prove authenticated Git push identity.
3. Push a harmless workflow comment and inspect its exact diff/SHA to establish
   workflow-file capability without changing validation logic.
4. Create an AI-authored draft PR; verify user.login=codexcodemachine, exact
   structured attribution fields and AI-authored label/description.
5. Inspect that exact head/tested merge SHA's CI: seven conclusions, App 15368
   sources, logs and downloaded artifacts. Retain hashes/expiry and review/push
   actors; unavailable evidence remains Unverified.
6. Then recreate the preparation draft as codexcodemachine and confirm published
   content/authorship/attribution. **Keep #15 open until confirmed.** Joshbomb75
   provides genuine independent review; no agent review or approval.

Initial metadata excluded the owner connector, but the later reconnection now
exposes it. This context fails owner-route exclusion and does not establish
complete credential separation. Successful
API reads, documentation publication and green CI cannot establish C2 or Phase C.
