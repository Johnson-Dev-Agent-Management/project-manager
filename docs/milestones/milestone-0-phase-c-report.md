# Milestone 0, Phase C acceptance report

- Milestone/phase: M0, Phase C — Branch enforcement and deliberate-defect verification.
- Status: **Incomplete. Enforcement and verification remain Unverified.**
- Implementation type: AI
- Implementation author: Codex Cloud
- Starting main: `0a923d420c3e7c22b339c193e7ce8e14e73d03b6`.
- Implementation draft: [#15](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/15).
  Current head/tested workflow SHA and final CI are recorded in its acceptance
  report after inspection; predecessor results do not validate a later head.
- Independent human: owner `Joshbomb75` confirmed human acceptance and merging of
  Phases A/B during this task. Same authenticated account created those PRs;
  GitHub has no recorded approving reviews on #7. This is owner acceptance,
  not independently authenticated GitHub approval.
- One implementation agent. No account/permission/protection/visibility changes,
  destructive probes, merges, purchases, deployment or orchestration performed.

| Requirement | Outcome                                               | Evidence and remaining condition                                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1          | Unverified                                            | Branch read reports main unprotected; rulesets list empty; detailed branch protection inaccessible (403). Exact proposed controls and owner readback procedure prepared, not applied                                                       |
| C2          | Unverified; current identity arrangement insufficient | Connector authenticates as owner `Joshbomb75`, repository role admin; cloud Git authenticated principal/scope not proven. Distinct restricted implementation identity and removal of reviewer credentials from agent reach remain required |
| C3          | Unverified                                            | Seven successful Phase B check names/source observed; no required-check enforcement demonstrated. CODEOWNERS and exact required-check/review configuration proposed; base-branch bootstrap and independent approval pending                |
| C4          | Unverified / Not run                                  | Full plan mapped to the disposable-target ledger; no target approved, no probes run. Draft CI validates preparation changes, not protection behavior                                                                                       |
| C5          | Passed (documentation only; human acceptance pending) | Recovery, failure handling, bounded exceptions, readback, artifact retention and safe stop procedure documented in the owner checklist                                                                                                     |
| C6          | Not run / Unverified                                  | Owner acceptance of Phase C pending; no authorized Phase C merge or resulting main run. M0 is not complete                                                                                                                                 |

## Verified prerequisites and observations

### Owner decisions after the initial inspection

The owner confirms the repository is **intentionally public**; the planning and
agent instructions now preserve that visibility while keeping cloud development
private. No visibility change occurred. The owner chose a dedicated automation
account as an outside collaborator with **Write on this repository only**, no
organization membership, Admin/Maintain access, bypass or personal owner credentials.
`Joshbomb75` remains the independent human reviewer and merger. Username, native
Codex connection, workflow-file access, CI capability and separation verification
remain pending; [manual setup guidance](../automation-account-setup.md) records
documented support versus the still-unverified account-specific paths.

The owner **conditionally approved only the exact two-branch settings proposal**
at `94c03cb3c1e108660d29954bb277b15552143acb`; its payload is unchanged. They
will apply settings in an owner-controlled session and provide readback after
all prerequisites. This is not permission for the agent to configure GitHub,
create/invite accounts, change permissions, incur costs or run destructive probes.
PR #15 must be recreated under the verified automation identity before independent
owner review; it has not been recreated. Both Git and every API/connector route
must exclude owner credentials, including alternative connections/retained state.

C15b is clarified to require a valid, independently reviewed PR and a separately
authorized owner merge under all target protections. No direct push or bypass is
allowed. It remains pending without that separate merge authorization. The actual
disposable target initial SHA is **Unassigned (target not created)**; reviewed
source SHA and exact probe operations must be pinned/approved before execution.
No Phase C enforcement result has changed from Unverified.

### Initial observation snapshot (historical)

Read `AGENTS.md`, the M0 plan, Phase A/B reports, engineering standards, CI
operation and PR template before changes. Cloud Git fetched current main and
matched the repository API at the starting SHA above. Phase B PR
[#7](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/7)
is merged, head `2f437b82c57a43bc50175251a15625c95081c388`, merged by `Joshbomb75`
at **2026-10-25 18:51:30 UTC** into the starting main SHA. The owner explicitly
confirms A/B human acceptance in this task. This satisfies owner acceptance for
preparation; identity separation remains an unmet enforcement prerequisite.

Current API observations on **2026-10-26 UTC** are retained in the
[sanitized inspection snapshot](evidence/phase-c/inspection.json). These are
point-in-time readbacks, not claims of protections activated:

- `GET branches/main`: `protected: false`, checks enforcement off and no contexts.
- `GET branches/main/protection`: **403 Resource not accessible by integration**.
  No detailed setting is inferred absent from this error.
- `GET rulesets?includes_parents=true`: `[]`; no listed repository/inherited rulesets.
  Effective-rules endpoint is unsupported by the connector; inaccessible details
  remain Unverified, including organizational restrictions and plan entitlement.
- Repository metadata: visibility **public**, owner an organization,
  `allow_auto_merge: false`, role flags include `admin: true`.
  Collaborator lookup independently reports `Joshbomb75` permission **admin**.
  This is the account role, not proof the integration has admin token permission;
  detailed protection read is actually denied. No write-to-settings probe attempted.
- Connector `get_user_login`: **Joshbomb75**, numeric ID **71676474**.
  Cloud `GH_TOKEN` is set (value never read/printed); `gh api user --jq '{login,id}'`
  fails **Forbidden**. No cloud Git actor or token scopes are inferred from it.
  Public `git fetch` succeeds but does not prove authenticated push identity.
- No tracked CODEOWNERS on starting main. Proposed `* @Joshbomb75` covers all
  existing/future policy including CODEOWNERS itself. Owner eligibility requires
  readback/validation on each actual target. The proposal cannot yet govern PRs.

The initial private planning assumption is superseded by the owner's confirmation
that public visibility is intentional. Organization billing/plan eligibility, audit logs,
all available credential scopes, additional credential routes and absence of
bypass privileges are **Unverified**. A missing administration capability in one
connector is not proof that owner credentials are unavailable everywhere.

## Traceable Phase B evidence (not Phase C probes)

Final Phase B PR CI
[40169819484](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40169819484)
is completed **success**, head `2f437b82c57a43bc50175251a15625c95081c388`.
The previously recorded PR tested merge is `d0b817ec499d306a99ee64670b6e6210aa2281bd`.
Fresh run/jobs API inspection verifies all seven job conclusions success.

Post-merge main-push CI
[40223238331](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40223238331)
is completed **success**, event `push`, head/tested main
`0a923d420c3e7c22b339c193e7ce8e14e73d03b6`. Job metadata and commit check-runs
were inspected, all seven conclusions success, all sourced from GitHub Actions
App **15368** (`github-actions`):

| Job           | Main-run evidence                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| frontend      | [121259144364](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40223238331/job/121259144364) |
| backend       | [121259144124](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40223238331/job/121259144124) |
| windows-smoke | [121259144328](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40223238331/job/121259144328) |
| policy        | [121259144362](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40223238331/job/121259144362) |
| supply-chain  | [121259144282](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40223238331/job/121259144282) |
| e2e           | [121259379410](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40223238331/job/121259379410) |
| quality-gate  | [121259943973](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40223238331/job/121259943973) |

These establish merged CI prerequisites/check source, not independent enforcement.
Historical failure probes and cached artifacts are not reused as Phase C results.

## Preparation validation

**Passed locally in the authorized cloud environment:** `bash scripts/setup.sh`
(Node **24.22.0**, npm **11.9.0**, SDK **10.0.402**, npm ci and locked NuGet
restore); complete `bash scripts/check.sh` (lint, strict TS checking, build,
**13 frontend**, **10 backend**, **26 Python** tests, zero failures/skips;
backend zero warnings/errors). Current measured coverage is frontend
**96.87% lines / 100% branches**, backend **100% / 75%**. Also passed
`node src/web/node_modules/prettier/bin/prettier.cjs --check .` and
`git diff --check`. Extra network access was needed for sandboxed cloud commands;
the default sandbox's first public Git fetch failed to connect to the proxy.

**Failed locally (infrastructure):** `bash scripts/policy.sh` exits 1 when the
checksum-pinned actionlint archive download returns HTTP **403**. Local actionlint,
ShellCheck and Gitleaks remain **Not run**; no scanner was substituted or disabled.
The current allowlist excludes the release-asset host. Local standalone security,
browser qualification and Windows checks are **Not run** for this bounded
policy/documentation change; the hosted complete workflow runs them unchanged.
Current fresh advisory status is not inferred clean from the local setup.

Hosted run links and exact head/tested workflow SHA are recorded in this draft PR
after inspection. No application behavior,
dependency locks, assertions, coverage scopes/floors, scanner policy, retry settings,
runner matrix, permissions or aggregate logic changed. Historical coverage:
frontend **96.87% lines / 100% branches**, backend **100% / 75%**; the independent
per-codebase **80% / 70%** floors are retained. Current advisory-data status and
coverage are only Passed after actual new CI inspection, not by reference to B.
Windows setup/build remains required. Screenshots: **Not applicable** to this
policy/configuration preparation; no UI changes or claimed probe observations.

## Policy changes, blockers and owner actions

Explicit protected-policy proposals:

1. Add `.github/CODEOWNERS` with the human owner as the whole-repository fallback,
   including all validation policy and future files. No implementation alternative.
2. Add only `codex/m0-phase-c-target` to CI's PR base filter so equivalent target
   PRs run the complete existing workflow. Main push trigger is preserved; no
   arbitrary-branch execution or privileged attribution changes.
3. Add the exact owner protection payload, approval/bootstrap/identity checklist,
   serial verification ledger and recovery procedures. These are proposals and
   instructions, not effective GitHub configuration or blanket probe approval.
4. Owner-directed follow-up corrects AGENTS/planning visibility to intentionally
   public source with private cloud development, records the chosen automation
   outside-collaborator approach and conditional approval without modifying the
   protection payload, and tightens C15b to a separately authorized owner merge
   of an independently reviewed valid PR. Historical A/B reports retain their
   original observations with a superseding visibility clarification. The new
   manual identity guide distinguishes documented support from missing live
   identity/permission evidence. No workflow, check or security threshold changed
   in this documentation follow-up.

Follow-up local validation: `bash scripts/check.sh` again passed **13 frontend,
10 backend, 26 Python** tests with zero failures/skips, the same coverage and
zero backend build warnings/errors; Prettier repository check and `git diff --check`
passed. `git diff 94c03cb -- .github docs/milestones/evidence/phase-c/proposed-protection.json`
is empty: the conditionally approved payload, CODEOWNERS and workflow are unchanged.
Follow-up hosted CI conclusions are recorded for the exact new head in PR #15;
the earlier successful run is historical evidence only.

The follow-up's ordinary Git push failed with **could not read Username for
https://github.com**. A subsequent connector identity read still returned
`Joshbomb75`; this is a partially unavailable Git path, not proof that owner
credentials are excluded from every route. No owner credential was restored.
The documentation is published through the existing owner-authenticated connector
to the same preparation draft; actual Git push capability for the new account
remains untested. Exact API-published head/tree and hosted validation are recorded
in PR #15; local Git commit metadata is not substituted for remote push identity.

**Exception register: none.** Identity separation and target approval are blockers,
not accepted exceptions. Follow [the concrete owner checklist](../branch-enforcement.md)
before settings changes or probes. Tooling cannot mutate protection settings;
owner application/readback is required if that remains true after approval.
Owner selected the automation outside-collaborator approach. They must manually
check billing and configure/connect that account, then verify its actual Git/API
identity, workflow-file access, CI capability and absence of owner/admin credentials
from all agent routes. Recreate the bootstrap PR only after these checks. No such
account/connection change was made by the agent.

Next work is the remaining Phase C settings/readback and full valid/defect matrix,
then owner review/acceptance and any separately authorized merge/main verification.
No subsequent milestone or M0 completion is authorized or claimed.
