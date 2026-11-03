# Milestone 0, Phase C acceptance report

- Status: **Incomplete; preparation updated, enforcement acceptance pending.**
- Implementation type: AI
- Implementation author: Codex Cloud
- Fresh readback: **2026-11-03 01:31:51 UTC**; implementation API principal
  **codexcodemachine / 348095294** only.
- Base main: `0a923d420c3e7c22b339c193e7ce8e14e73d03b6`.
- Preparation: **codex/m0-phase-c**, [draft PR #15](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/15).
  Its authenticated author remains Joshbomb75. Keep it open until the documented
  prerequisites and verified automation-authored replacement are complete.
- Independent human reviewer/merger: Joshbomb75; no review submitted by the agent.

This report supersedes the October 28 current-state conclusions. Historical JSON
and Phase A/B reports remain dated evidence. The owner reports configuring main
and removing the owner connector. Fresh readback verifies the reported protection
and account-list changes below; it does not verify inaccessible detailed settings.
No permissions, protections, credential configuration or target refs were changed.
No owner/unidentified credential, review, approval or merge was invoked.

**Later owner steering:** the user reconnected their personal GitHub account and
authorized it for read-only verification. Rechecking live profile, account and
installation metadata still returns only codexcodemachine and the organization,
with no account selector. Plugin discovery confirms GitHub is installed/enabled
but exposes no additional route. A fresh chat may refresh connection tools;
managed connector administration restrictions may still require an owner export.
Publication remains codexcodemachine-only. If an owner route becomes exposed,
this verification context cannot establish isolated implementation C2.

## Acceptance status

Passed means directly verified within the stated scope; Failed means an observed
requirement is unmet; Unverified means evidence is missing or execution is pending.

| Criterion | Outcome        | Evidence, reason and next action                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1        | **Unverified** | Main is protected; all seven required checks are bound to App 15368; auto-merge is false. Detailed protection GET is 403. Strictness, PR/review requirements, restrictions, admin enforcement, force/deletion settings, rule IDs and bypass lists need complete owner export.                                                                                                                                                         |
| C2        | **Unverified** | Live API ID 348095294, Write, push=true, admin=false, maintain=false and reported memberships [] verified. Joshbomb75 is absent from current connector accounts/installations and no account selector is advertised. Complete scope/bypass and cloud credential isolation remain unverified: GH_TOKEN is present without a declared binding and is not invoked. Git identity/push/workflow write/remote push actor remain unverified. |
| C3        | **Failed**     | Exact base tree contains no CODEOWNERS and #15 has no submitted reviews. Required check/source configuration is verified, but independent policy ownership/enforcement is unmet. Complete identity prerequisites, replacement and genuine human bootstrap review; verify GitHub-validated ownership on actual base after separately authorized merge.                                                                                 |
| C4        | **Unverified** | Every one of the 31 planned rows and its grouped subcases remains unrun. Target/source/creation/protection/exact scope are not authorized. Each case retains its reason and next action in the probe ledger.                                                                                                                                                                                                                          |
| C5        | **Passed**     | Recovery, exception and evidence-retention procedures are documented. No operative exception, silent bypass or relaxation. Human acceptance remains C6.                                                                                                                                                                                                                                                                               |
| C6        | **Unverified** | Owner acceptance and any separately authorized merge, resulting-main checks, protections/base ownership readback and private cloud baseline refresh remain pending.                                                                                                                                                                                                                                                                   |

[Fresh context readback](evidence/phase-c/fresh-context-readback.json) records the
observed fields and missing values explicitly. [Probe status](milestone-0-phase-c-probes.md#probe-acceptance-status)
keeps detection and protection enforcement separate. Green CI, draft status,
conflicts, missing approval, pending/unrelated failed checks, generic network or
permission denials and failed leases do not prove the intended control.

## Identity and credential separation

The verified connector reports codexcodemachine, collaborator Write, repository
admin=false and maintain=false. Organization and membership calls both report
`[]`; this is a reported membership result, not proof of every grant or billing
status. Current account metadata lists only Johnson-Dev-Agent-Management and
codexcodemachine; installations are **172621871** and **175319904**. Joshbomb75's
previously listed installation/account is absent. The current tool schemas expose
no owner account selector. No owner connection was invoked.

Both installations report repository_selection=all and viewer_can_administer=null.
These fields do not inventory the effective connection's credential permissions,
repository scope, bypass rights or every reachable credential route. A denied
administration GET is not proof of complete scope isolation.

Cloud readiness is current and enforced, with no declared secret/runtime/outbound
identity bindings. A presence-only check finds GH_TOKEN; its value is never read,
printed or used. No Git credential helper, askpass or SSH command is configured;
standard hosts.yml, .git-credentials and .netrc are absent. These bounded checks
leave whole-context owner-route exclusion **Unverified**, rather than asserting
the former owner selector remains exposed.

Public Git fetch succeeded with helper, askpass and authorization headers disabled.
The initial sandbox socket denial was resolved using supported per-command network
access. Neither result proves authenticated Git push identity. The API host is
outside the cloud allowlist. No unidentified credential, alternate route, token
generation or credential expansion is used. Ordinary identity-check branch work
and replacement PR creation remain pending documented isolation/scope/bypass
prerequisites. Supported API preparation proceeds independently.

## Main controls and base ownership

Fresh main is unchanged at the exact SHA above, tree
`0763d03f681e11e4c2ae866dfdb4c7cdf68bbf70`. The branch endpoint reports
protected=true and protection enabled. Its required-check list contains
**frontend, backend, windows-smoke, e2e, policy, supply-chain, quality-gate**,
each with **app_id 15368**, enforcement_level=everyone. Repository auto-merge is
false. The ruleset collection including parents is empty. This is consistent
with classic protection; an empty ruleset collection is not a protection failure.

Detailed protection GET returns **403 Resource not accessible by integration**.
Effective branch-rule and CODEOWNERS-error URLs are rejected by this connector's
endpoint allowlist. These are access limitations. They do not establish any
missing setting's value. The following remain **Unverified**:

- Classic rule ID/pattern and any independently applicable/inherited rule details.
- PR requirement; strict up-to-date checks; approval count and human independence;
  code-owner reviews; stale dismissal; last-push approval; conversation resolution.
- Dismissal and protected updates restricted to Joshbomb75, empty team/app lists,
  preservation of all PR/check/review requirements, admin enforcement and bypass lists.
- Force pushes and deletion disabled; complete scope/bypass inventory.

A non-secret UTC-dated owner export was requested using the existing handoff.
No export arrived before this report was prepared. Preserve stronger controls and
union required checks; do not replace settings from this partial readback.

The untruncated recursive **actual base** tree and local Git tree contain no
CODEOWNERS. The proposed `* @Joshbomb75` in .github/CODEOWNERS remains unchanged;
it covers itself and existing/future files, but is not effective on main.
GitHub validation and eligible owner/review-request evidence must be checked on
the actual base after independently reviewed, separately authorized bootstrap.
Do not weaken protections for the owner-authored #15.

## Validation and retained evidence

Entry preparation head **`67035dfa7f0e87a6ee5ae4601515800524ed96a7`**, tested
merge **`0e29546900765364a1861d5537c83d44dc7af5ef`**, was freshly rechecked in
[run 40632431988](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40632431988).
All seven jobs succeeded; every required check was produced by App 15368.
All seven decoded job logs were read, and the gate confirms both exact SHAs and
explicit success for all six dependencies. Checks are attached to the PR head;
querying the tested merge's checks returned zero and is not used to infer failure.

[Retained entry CI evidence](evidence/phase-c/ci-recheck-2026-11-03.json) records
job/check/source IDs, relevant diagnostic excerpts, artifact digests/expiry and
report inspection. Seven of eight archives were transferred and their SHA-256
digests checked. Available tested-commit files and production provenance match
the tested merge; production output hashes were checked. Selected test, coverage,
policy/security reports and production provenance summaries are retained before expiry under
[evidence/phase-c/retained-entry](evidence/phase-c/retained-entry/README.md).
The **33,607,179-byte E2E ZIP exceeds the 32 MiB executor transfer limit**.
Its archive download reference, metadata/digest and successful ten-run decoded
log were obtained, but local archive-byte inspection remains **Unverified**.
The owner should retain that full ZIP before **2026-11-04 04:30:46 UTC**.
No download URL or credential is committed.

Entry reports show **13 frontend, 10 backend, 26 Python tests**, zero skips/failures;
frontend **31/32 lines (96.87%), 24/24 branches (100%)**; backend **100% lines,
75% branches**. Ten consecutive production-output browser executions used zero
retries. Windows repeated setup/build, policy and supply-chain passed. Entry
security reports show zero npm advisories, expected NuGet source/project and no
listed vulnerable packages, plus empty redacted history/tree secret findings.
Those October 28 audits do not establish today's advisory state.

**Passed locally:** bash scripts/setup.sh and complete bash scripts/check.sh,
using Node 24.22.0, npm 11.9.0 and SDK 10.0.402; 13 frontend, 10 backend and
26 Python tests, zero failures/skips, backend zero warnings/errors. Coverage is
unchanged. Repository Prettier and git diff --check pass. Link/JSON checks and
the protected-policy comparison are recorded in the final PR handoff.
**Failed / infrastructure:** bash scripts/policy.sh exits 1 when its pinned
actionlint archive download returns HTTP 403. Standalone actionlint, ShellCheck
and Gitleaks therefore remain Not run locally; no substitute, suppression or
network bypass is used. Local browser qualification and Windows are Not run for
this documentation-only continuation; the final hosted lanes are inspected.
No new test is added for these prose/evidence edits.

**New hosted failure, requiring review:** head
`f21a64a6d4d858afd6fb825bc99523414a82adf0`, tested merge
`7d59b4e6d1ddcbd552eb3c2bc9390365578c5c64`,
[run 41560967603](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/41560967603)
fails supply-chain. Fresh npm data reports **14 moderate, zero high/critical**
findings, rooted in minimatch **GHSA-g3hv-75wg-m249**, potential denial of service
through globparts amplification in versions below 11.0.1. These are development
lint/parser tooling paths, not runtime product dependencies. Crafted glob inputs
can exhaust tooling resources; untrusted PR/configuration handling still matters.
Upstream compatible remediation and reachability need human review by Joshbomb75;
no dependency downgrade, forced override, accepted risk or exception is introduced.
NuGet advisory retrieval succeeds without listed vulnerable packages.

All seven job conclusions, App 15368 source IDs and decoded logs were inspected:
frontend, backend, windows-smoke, e2e and policy succeed; supply-chain and
quality-gate fail. The gate correctly propagates supply-chain failure. E2E
completes all ten executions with zero retries. This is execution evidence,
not a Phase C target probe or independently attributed protection enforcement.

The blocking scanner reports **10 generic-api-key findings** on the retained
production provenance maps: filenames containing Api beside independently verified
SHA-256 file hashes, duplicated in the CI JSON. The artifact ZIP digests, original
manifest hashes and downloaded output-byte hashing establish their non-secret
provenance. No credential values were inspected. Only sanitized rule/file/line/
commit metadata is retained in
[the follow-up readback](evidence/phase-c/followup-readback.json).
The current tree now retains commit/run/file-count/original-manifest-digest
summaries, with the original raw maps remaining in the referenced artifact ZIPs.
**A normal correction does not erase the earlier full-history findings.** The
current shared branch therefore remains blocked without weakening the scanner.
No suppression/allowlist, history rewrite/force-push or silent exception is used.
After isolation/capability prerequisites, a clean successor based on the last
pre-evidence-hash head can be independently validated and reviewed as the
replacement; keep #15 open until confirmation. These incidental scanner findings
are not authorized Phase C probes or an enforcement pass.

Final published head, tested merge, all seven jobs/sources, logs and relevant
artifacts are inspected after publication and recorded in PR #15, avoiding an
untested self-referential evidence commit. Entry CI never validates later edits.

## Policy preservation and recommendations

This continuation updates documentation and evidence to reflect protected main,
owner-account removal from advertised connector metadata, remaining readback and
credential gaps, retained CI evidence and the ordered owner handoff. No application,
assertion, test discovery/report-integrity, coverage-scope/exclusion/floor,
security, retry, aggregate-failure, lockfile or workflow logic changes are made.
Independent **80% line / 70% branch floors per codebase** remain intact.
The prior preparation's CODEOWNERS and disposable-target PR-base trigger proposal
are preserved. The trigger does not authorize target creation or any probe.

**Owner merge recommendation: hold.** Complete detailed readback, supported
implementation isolation/Git/workflow/remote-actor verification, automation-authored
replacement and genuine independent human policy/bootstrap review at the exact
green head. Keep #15 open until replacement confirmation. Never submit human
review, merge, relax protection or use owner credentials in this session.

**M0 completion recommendation: incomplete.** Every probe remains Unverified.
Only future target is **codex/m0-phase-c-target**; reviewed source/initial SHA is
Unassigned. Creation, equivalent protection and exact probe operations require
separate authorization. C15b additionally requires a valid independently reviewed
PR and separately authorized **owner merge under target protections**. Never
substitute direct push, relaxation, bypass, or a defect merge.

The [owner handoff](milestone-0-phase-c-owner-handoff.md) starts with the two
independent evidence gaps: complete current protection export and supported
implementation credential/isolation metadata. After those, complete bounded
capability/replacement/human review, then make separate target/probe/merge decisions.
After any separately authorized owner merge, verify all seven checks on the exact
resulting main SHA, recheck protections and GitHub-validated base CODEOWNERS, retain
evidence and refresh the private cloud baseline. Owner acceptance is required.
