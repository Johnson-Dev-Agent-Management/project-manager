# Phase C — ordered owner handoff

**Ready for owner action; Milestone 0 is not complete.**
The agent uses only codexcodemachine. No owner credential, permission change,
merge or mutation/destructive probe is used in this continuation.

## 1. Completed work and evidence

Main remains `0a923d420c3e7c22b339c193e7ce8e14e73d03b6`; preparation is on
**codex/m0-phase-c**, [draft PR #15](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/15).
Whole-repository `* @Joshbomb75` CODEOWNERS, all existing tests/checks and the
protection proposal are preserved. API identity **codexcodemachine / 348095294**,
Write, admin=false, maintain=false and reported empty memberships were rechecked.
Git transport identity, full credential scope/bypass and fresh isolation remain
Unverified. Joshbomb75 is still advertised as a selectable connection, but was
not invoked here; the unidentified CLI credential was not used.

Previously verified preparation head `3c1abc138a95f98e3f9946cf4b0c4d8fde5e588b`,
tested merge `1daadb66b0fd5f6512f4eb847bcb7520ad2a40eb`, passed all seven jobs in
[40628124981](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40628124981).
It does not validate later handoff edits. The PR body records the final published
head/tested merge, fresh seven-job CI links, log/artifact inspection and local
validation after this handoff is published; no predecessor CI is reused.
See the [acceptance report](milestone-0-phase-c-report.md),
[continuation readback](evidence/phase-c/continuation-readback.json) and
[per-probe status](milestone-0-phase-c-probes.md#probe-acceptance-status).

## 2. Identity setup, independent of main configuration

Use supported platform configuration to start a **fresh implementation context**
with only codexcodemachine API and Git routes; owner credentials must be outside
that context. Keep the owner's separate browser/session for administration/review.
Do not create accounts, change roles/membership, broaden credential permissions,
paste tokens or buy services. If supported isolation/Git authentication cannot be
provided within current access, report that limitation for a separate setup decision.

Then the agent can perform the already-approved bounded capability work on
ordinary **codex/m0-phase-c-identity-check**: actual Git push, harmless workflow
comment, independently observable remote push actor, automation-authored draft
and exact-SHA CI/job/log/artifact reads. API publication, Git author/email and CI
actor alone are insufficient. After success, the agent recreates the preparation
draft as codexcodemachine and keeps #15 open until the replacement is confirmed.
Joshbomb75 supplies genuine human review; the agent never submits it.

## 3. Main configuration — already approved, owner session only

This work can proceed independently of identity setup, after complete before-state
readback. The connector lacks administration read/write; do not reconnect it or
weaken settings to work around that limit. Owner configuration is now explicitly
handed off at the user's request. **Only main is approved.**

1. In your existing owner-controlled GitHub session, open repository **Settings →
   Branches** and **Settings → Rules → Rulesets**. Inspect every rule matching
   main, including inherited rules and bypass actors. Export the readback in §4
   **before** editing. A 403 is inaccessible, not absence. Stop if the before-state
   is incomplete; preserve stronger settings and union existing required checks.
2. Under **Branches → Branch protection rules**, edit the effective main rule or
   choose **Add classic branch protection rule** with exact pattern **main**.
   An active equivalent ruleset is acceptable only if all controls can be expressed
   and read back. Do not replace inherited rules or add other targets/tags/queues.
3. Apply the values below; retain any stronger existing count/control and every
   existing required check. Save, then export/read back again. If the UI cannot
   express a value or bind a check's source, stop and report that exact gap.
4. Under **Settings → General → Pull Requests**, keep **Allow auto-merge** unchecked.

| UI control                                                         | Value                                                                 |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Require a pull request before merging                              | On; no allowed users/teams/apps to bypass PRs                         |
| Required approvals                                                 | 1 independent human approval, or retain a higher existing count       |
| Require review from Code Owners                                    | On                                                                    |
| Dismiss stale pull request approvals when new commits are pushed   | On                                                                    |
| Require approval of the most recent reviewable push                | On; approver must differ from latest pusher                           |
| Restrict who can dismiss pull request reviews                      | Joshbomb75 only; no team/app allowance                                |
| Require conversation resolution before merging                     | On                                                                    |
| Require status checks to pass before merging                       | On; union all seven names below with existing checks                  |
| Require branches to be up to date before merging                   | On (strict=true)                                                      |
| Do not allow bypassing the above settings / include administrators | On (enforce_admins=true); no implementation bypass                    |
| Restrict who can push to matching branches                         | Joshbomb75 only; no teams/apps; keep all PR/check/review requirements |
| Allow force pushes / Allow deletions                               | Both off                                                              |
| Allow auto-merge                                                   | Repository setting off                                                |

Required names: **frontend, backend, windows-smoke, e2e, policy, supply-chain,
quality-gate**. Select **GitHub Actions** as the expected source for **each**;
readback must show **app_id 15368**, not Any source. The metadata-only label job
and Dependabot do not replace any required check. App 15368 establishes the
producer, not independent trust in editable workflows; human policy review remains
required. GitHub's review count alone does not prove the approver is independent.

The [classic JSON proposal](evidence/phase-c/proposed-protection.json) is an exact
baseline, **not safe to PUT blindly**. Owner-session command, only after comparing
complete before-state and preparing a reconciled payload preserving stronger
values/checks: `gh api --method PUT repos/Johnson-Dev-Agent-Management/project-manager/branches/main/protection --input reconciled-main-protection.json`.
Use only the actual reconciled, reviewed payload file. No target PUT.

Main currently lacks CODEOWNERS. Protection alone does not install it. Keep the
proposed `* @Joshbomb75`, including CODEOWNERS itself and future files, for the
independently reviewed replacement/bootstrap. Do not weaken protections or merge
the owner-authored #15 to bypass the independence prerequisite.

## 4. Return non-secret readback for verification

In your **existing owner-controlled session**, confirm `gh api user` identifies
Joshbomb75 / 71676474 before using it. Do not send `gh auth token`, credentials,
authorization headers or environment dumps. These commands are read-only and
are for your session, not agent execution:

```bash
repo=Johnson-Dev-Agent-Management/project-manager
phase_c_output=phase-c-owner-before
# Repeat with phase_c_output=phase-c-owner-after after saving settings.
mkdir -p "$phase_c_output"
date -u +'%Y-%m-%dT%H:%M:%SZ' > "$phase_c_output/observed-at-utc.txt"
gh api user --jq '{login,id}' > "$phase_c_output/identity.json"
gh api "repos/$repo" --jq '{full_name,visibility,permissions,allow_auto_merge}' > "$phase_c_output/repository.json"
gh api "repos/$repo/branches/main" > "$phase_c_output/main.json"
gh api "repos/$repo/branches/main/protection" > "$phase_c_output/main-protection.json"
gh api --paginate --slurp "repos/$repo/rulesets?includes_parents=true&per_page=100" > "$phase_c_output/rulesets.json"
gh api --paginate --slurp "repos/$repo/rules/branches/main?per_page=100" > "$phase_c_output/effective-main-rules.json"
gh api graphql -f query='{repository(owner:"Johnson-Dev-Agent-Management",name:"project-manager"){branchProtectionRules(first:100){nodes{id pattern} pageInfo{hasNextPage endCursor}}}}' > "$phase_c_output/classic-rule-ids.json"
```

Return **both before/after folders**, any read errors/HTTP status, and the **full
JSON detail for every listed applicable repository/inherited ruleset** (GET its
returned `_links.self.href`, retaining rule ID, conditions, enforcement, rules and
bypass actors). If GraphQL reports hasNextPage=true, collect the remaining pages.
Before creation, an authorized protection 404 may establish no classic protection;
an empty/failed output file does not. Return all errors rather than suppressing them.

If CLI is unavailable, return dated screenshots of every matching classic rule,
all review/check/source/update/admin/force/deletion settings, all applicable
ruleset conditions/rules/enforcement/bypass lists and General → auto-merge off,
plus main's exact SHA. Omitted/inaccessible fields remain Unverified. JSON is
preferred for source IDs, rule IDs and complete actor lists.

After a separately authorized bootstrap merge, additionally return the exact
main SHA, base CODEOWNERS content, GitHub CODEOWNERS errors/validation and actual
review requests/owner eligibility. CLI readback: `gh api "repos/$repo/contents/.github/CODEOWNERS?ref=<exact-main-sha>"`
and `gh api "repos/$repo/codeowners/errors?ref=<exact-main-sha>"` (substitute the
actual SHA). Retain any errors; no validation success is inferred from file presence.

## 5. Verification, later decisions and acceptance

The agent compares every setting/source/actor/ID with the proposal and records
UTC times and exact refs. Until independently attributed probes run, settings
readback is configuration evidence, not behavior/enforcement evidence.

| Criterion | Status     | Reason and next action                                                                                                                                               |
| --------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1        | Failed     | Main reports unprotected; configure main and return complete effective readback                                                                                      |
| C2        | Unverified | API role verified, Git/scope/isolation not; complete §2                                                                                                              |
| C3        | Failed     | Required-check/independent policy enforcement and base CODEOWNERS absent; configure, independently review/bootstrap, validate base ownership and observe enforcement |
| C4        | Unverified | Every probe is unrun; complete prerequisites and obtain exact target/scope authorization                                                                             |
| C5        | Passed     | Recovery/exception/evidence procedures documented; no silent bypass or operative exception                                                                           |
| C6        | Unverified | Owner acceptance/later merge/main validation/cloud refresh pending                                                                                                   |

**Already approved:** repository preparation/validation/PR updates as
codexcodemachine; bounded ordinary-branch capabilities after verified isolation;
the documented main protections and owner readback. **Not approved:** target
reviewed source SHA, creation/protection/scope, mutation/destructive probes or any
merge. C15b additionally requires a valid independently reviewed PR and separately
authorized owner merge under target protections. Only future target is
**codex/m0-phase-c-target**; actual initial SHA remains Unassigned.

**Later merge decision:** hold until replacement/authentication, independent
human policy/bootstrap review and effective protections are verified at the
exact green head. No agent approval/merge, no deliberate-defect merge, no temporary
relaxation. After any separately authorized owner merge, all seven checks must
pass on the exact resulting main SHA; recheck protections and base CODEOWNERS,
retain evidence and refresh the private cloud baseline. M0 completion requires
independent C1–C6/probe verification and owner acceptance.

**Smallest next checklist:** (1) arrange the fresh isolated implementation context;
(2) capture before-state, configure main and return before/after readback. Keep
target/probe/merge decisions for their explicit later authorization.
