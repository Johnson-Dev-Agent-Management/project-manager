# Branch enforcement — Phase C owner checklist

Status: **Proposed; not applied. Milestone 0 remains incomplete.**
See the [acceptance report](milestones/milestone-0-phase-c-report.md) and
[probe ledger](milestones/milestone-0-phase-c-probes.md). This is a reviewable
configuration package, not authorization to change settings or run destructive
probes. One implementation agent; no autonomous merging or additional AI review.

## Identity prerequisite

The current connector authenticates as `Joshbomb75`, the human owner's account.
The owner confirms that this account also creates the AI PRs and that they
human-approved and merged Phases A/B. An AI-authored label declares implementation
authorship, not authentication independence. GitHub cannot count the PR author's
own approval. A separate chat, Git author name, bot comment, or credential for the
same account does not solve this.

Proposed human policy reviewer and designated merger: **Joshbomb75**, subject to
explicit checklist approval. Proposed implementation identity: **unassigned**.
The owner must choose and approve one supported path:

- A distinct machine account with repository Write access only, using credentials
  limited to this repository; no organization ownership, Admin/Maintain, rule
  bypass, or reviewer credential access. Verify any seat cost before provisioning.
- A GitHub App that can author PRs as its own principal and push branches end to
  end, with repository-only installation and minimum contents/pull-request write
  permissions (workflows write only if necessary and explicitly approved).
  Existing connector installation does not prove this contribution path exists.

Do not provision, install, purchase, revoke, or change permissions implicitly.
Use the supported environment/connection configuration to switch both Git and
connector credentials. Never paste credentials into chat, commits or evidence.
Remove owner-capable credentials from agent reach, including alternative connector
connections. Verify Git push and API identities independently on an ordinary
feature branch. Public fetch success proves read connectivity only. Record actual
PR author, push actor, repository role, credential scope, app permissions, and
absence of administration/bypass. A role response is not a token-scope inventory.

This preparation draft may be owner-authored under existing authentication. It
must be recreated under the approved implementation principal before `Joshbomb75`
can provide an independent bootstrap approval. Alternatively, an explicitly
designated qualified second human may approve, but that alone does not remove
owner credentials from agent reach. Both credential separation and independent
approval must be resolved. No approval is to be submitted by the implementation
agent, even if an API would accept it.

## Exact proposed configuration

Use classic branch protection for the two exact branch names **main** and
**codex/m0-phase-c-target**, with identical settings below. No wildcard targets,
tag rules, organization changes, visibility changes, or additional repositories.
If existing rules are discovered, export and preserve them and union their checks
with this list. Do not replace protections from a partial/403 read. Reconcile
overlapping rules with the owner before applying a different configuration.

| Setting                                         | Proposed value                                                                                        |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Require a pull request                          | Enabled; no PR bypass users, teams or apps                                                            |
| Required approving reviews                      | 1 independent human approval                                                                          |
| Require code-owner review                       | Enabled; `.github/CODEOWNERS` on the target names only `@Joshbomb75` for `*`                          |
| Dismiss stale approvals on new commits          | Enabled                                                                                               |
| Require approval of most recent reviewable push | Enabled; approver must differ from latest pusher                                                      |
| Restrict review dismissal                       | `Joshbomb75` only, no teams/apps; do not dismiss blocking review for a probe                          |
| Required conversations resolved                 | Enabled                                                                                               |
| Required status checks                          | All seven below, plus every existing required check                                                   |
| Expected check source                           | GitHub Actions App ID **15368** for each of these seven checks                                        |
| Require branch up to date                       | Enabled (`strict: true`)                                                                              |
| Include administrators / disallow bypass        | Enabled (`enforce_admins: true`); no implementation bypass                                            |
| Restrict who can push                           | `Joshbomb75` only; empty team/app lists; PR/check/review requirements still apply                     |
| Allow force pushes / deletions                  | Both disabled                                                                                         |
| Auto-merge                                      | Keep repository `allow_auto_merge: false`; no merge queues or autonomous merger                       |
| Other controls                                  | Preserve existing stronger settings; no permission, visibility, signature, or merge-method relaxation |

Required names, exactly: **frontend**, **backend**, **windows-smoke**, **e2e**,
**policy**, **supply-chain**, **quality-gate**. Source ID 15368 is observed on the
successful Phase B main run. Neither Dependabot nor the metadata attribution job
is a replacement. `quality-gate` additionally rejects any non-success dependency.
GitHub may consider a skipped check successful; the separate aggregate job must
therefore remain required and must explicitly fail the skipped-dependency probe.

Check names and source identify the App, not a trustworthy workflow definition.
An implementation can change a GitHub Actions workflow to emit misleading green
results. Required independent human policy review is essential; no claim of
centrally enforced workflow provenance is made. Admins can still edit protection
configuration; their credentials must remain outside agent reach.

The following owner-run API payload is exact for the proposed baseline. It is
committed as [proposed-protection.json](milestones/evidence/phase-c/proposed-protection.json).
It is **not a safe replacement** if the owner export discovers additional controls
or required checks: revise and approve the union first.

## Owner application and readback

The available connector has read/PR/Git-data tools but no protection-setting
mutation tool. Its detailed protection read returns 403; cloud `gh api user`
is denied by network policy. Do not broaden agent administration access to apply
this package. The owner can use GitHub Settings → Branches → Add/Edit branch
protection rule, select each exact name, and enter the table above. Set all seven
check sources explicitly to GitHub Actions, rather than Any source. GitHub may
require a recent pilot run before listing checks. If the UI/plan cannot express
any setting, stop and record that control **Unverified**, without substituting a
weaker configuration.

Alternatively, on an owner-controlled machine/session with `gh`, outside the
agent environment (these are owner instructions, not agent execution):

```bash
repo=Johnson-Dev-Agent-Management/project-manager
# Export BEFORE applying. 404 is absence only with confirmed authorized access;
# 403 is inaccessible. Retain rulesets and org inheritance as well.
gh api "repos/$repo/branches/main/protection" > main-protection-before.json
gh api "repos/$repo/rulesets?includes_parents=true" > rulesets-before.json
# After explicit approval and only after reconciling the full before-state:
gh api --method PUT "repos/$repo/branches/main/protection" \
  --input docs/milestones/evidence/phase-c/proposed-protection.json
gh api --method PUT "repos/$repo/branches/codex%2Fm0-phase-c-target/protection" \
  --input docs/milestones/evidence/phase-c/proposed-protection.json
# Capture both full responses; a successful PUT alone is not verification.
gh api "repos/$repo/branches/main/protection" > main-protection-after.json
gh api "repos/$repo/branches/codex%2Fm0-phase-c-target/protection" \
  > target-protection-after.json
gh api "repos/$repo/rulesets?includes_parents=true" > rulesets-after.json
```

Do not run the PUTs unless the target exists and this exact scope is approved.
Export/read errors must be resolved before mutation. Keep responses free of
credentials; share only configuration evidence. The agent must compare readback
against every row and record retrieval time, rule IDs (if any), branch/base SHA,
check names/source, bypass lists, review and push settings. A screenshot may
supplement authorized JSON readback; inaccessible fields stay **Unverified**.
Also verify CODEOWNERS on each base and its GitHub validation/errors, owner Write
access, real review requests, and restrictions for the actual implementation actor.

## Approval checklist and bootstrap order

The owner must approve each item explicitly; blank boxes are not approvals.

- [ ] Confirm A/B accepted (owner confirmed in this task); accept current public
      visibility discrepancy as unresolved without changing visibility here.
- [ ] Select the distinct implementation account/App and approve its exact
      repository-only permissions. Confirm no new cost without separate consent.
- [ ] Confirm `Joshbomb75` as human policy reviewer/merger with Write eligibility;
      attest reviewer/admin credentials are unavailable to the agent through both
      Git and every API/connector route. Verify this before enforcement probes.
- [ ] Independently review the CODEOWNERS bootstrap and the sole CI trigger
      addition for `codex/m0-phase-c-target`; recreate this draft under the distinct
      principal before owner approval. Owner alone decides any bootstrap merge.
- [ ] Approve the exact two-branch settings table/payload after complete before-state
      reconciliation. Preserve all existing required checks and stronger rules.
- [ ] Approve owner creation of `codex/m0-phase-c-target` from the reviewed Phase C
      implementation SHA recorded in the PR (full SHA must be pinned at approval).
      It must include CODEOWNERS and the target CI trigger. Record creation SHA;
      do not add unreviewed policy differences to make probes pass.
- [ ] Approve only the disposable target probes in the ledger: ordinary PRs from
      `codex/m0-phase-c-probe/<id>` targeting `codex/m0-phase-c-target`, never main;
      direct fast-forward update, non-fast-forward update and deletion attempts
      against that exact target only, with the separated implementation credentials.
      Intended result for all three ref attempts: rejection. No merge API attempts.
- [ ] Approve target-only cancel/skip, policy tamper, synthetic-secret and status-source
      probes. Source spoof uses an existing explicitly identified non-Actions
      principal only if allowed; no permission escalation or credential sharing.
- [ ] Approve retention of failing probe branches/closed PR history as evidence;
      cleanup by closing PRs, with target/probe branch deletion left to owner after
      evidence review. No deliberate-defect merge, even into the disposable target.

Before main protection acceptance, CODEOWNERS must be present on main through an
owner-controlled, independently reviewed bootstrap. Do not temporarily weaken
review settings to merge an owner-authored bootstrap. A protected branch without
CODEOWNERS cannot prove policy ownership. The disposable target can be prepared
and protected first, then verified, before the owner decides any main merge.

## Verification, recovery and limits

Follow the ledger serially using one implementation agent and existing CI budgets.
For each non-draft probe capture full PR head/base/tested merge SHAs, job links and
conclusions, reviews and latest-push actor, required review/check state, and effective
protection readback. `mergeable: true` alone means conflict-free, not authorized.
Use ready PR UI/GraphQL reviewDecision and mergeStateStatus or equivalent owner
evidence; REST blocked is useful but must be attributed to the intended control.
Unknown/pending results, drafts, unrelated CI failures and unsatisfied extra gates
cannot prove a specific protection. The owner observes merge eligibility without
merging; no potentially successful merge call is permitted.

For policy/approval probes, first obtain green unmodified checks and prove the
missing human/code-owner approval is the blocker. For defective CI probes, record
the relevant job's actual failing assertion/diagnostic as well as the aggregate
failure. Never make controls weaker to obtain a desired observation. Close the
defect PR afterward; repairing its head is not evidence that the defective SHA
was blocked. For approval/base freshness, use separate valid disposable PRs;
if another blocker masks freshness, record the probe **Unverified**.

If CI fails, diagnose retained logs/artifacts, fix on the feature branch, and rerun
required checks at the new SHA. Never replace a required check with a manual success.
If advisory data is unavailable, leave the security gate failing/incomplete.
Artifacts expire in seven days: retain redacted diagnostics and immutable links
before expiry. Do not store real credentials or raw secret findings.

If a prohibited target ref operation unexpectedly succeeds, stop probes immediately,
record sanitized command/response and before/after SHAs, notify the owner, and
leave main untouched. The owner investigates identity/rules and restores the
disposable target from the pinned known-good SHA; the agent does not force-reset
or recreate it to hide the result. Repeat relevant probes only after reviewed
correction and a new exact approval if the scope changes.

If credentials are compromised, stop, have the owner revoke/rotate them outside
the agent session, inspect the GitHub audit trail and changed refs/rules, then
re-establish separation and repeat affected verification. Do not collect tokens
as incident evidence. If owner access is lost, use GitHub's owner recovery/support
path. No standing agent bypass or emergency credential is permitted.

Exceptions follow [engineering standards](engineering.md): exact rule and scope,
rationale, named independent reviewer/accountable owner, approval evidence, expiry,
and removal/retest plan. Current register: **none**. An exception cannot justify
claiming an untested or bypassable requirement passed. No silent disabling of
checks, relaxed floors, visibility change, or budget increase is authorized.

Final C6 requires owner acceptance and, only if the owner authorizes and performs
a merge, a successful CI push run for that exact resulting main SHA. Refresh the
cloud checkout from that SHA. No M0 completion claim until C1–C6, identity
separation, and the full required matrix are verified.
