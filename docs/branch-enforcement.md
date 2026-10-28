# Branch enforcement — Phase C configuration package

Status: **Main configuration authorized; blocked by connection capabilities.
No settings applied. Phase C and Milestone 0 remain incomplete.**
See the [report](milestones/milestone-0-phase-c-report.md) and
[fresh readback](milestones/evidence/phase-c/audit-readback.json).
Earlier instructions delegating routine settings entry to the owner are superseded.

## Authorization and identities

The current assignment authorizes `Joshbomb75` (ID `71676474`) for the listed
administration of **main**. The agent must perform configuration/readback when a
supported owner route exists. It does not authorize reviews, approvals, merges,
mutation/destructive probes, account creation, collaborator/organization changes,
visibility changes, purchases, or broader credential permissions. Preserve public
source and private cloud development. Never inspect or retain secret values.

Use `codexcodemachine` (ID `348095294`) for implementation publication and future
PR authorship. API identity, collaborator Write, push=true, admin=false,
maintain=false and reported empty organization memberships are verified. Role
does not inventory credential scope or prove absence of bypass. Owner access
here is intentional administration access and does not establish C2. Verify full
separation in a fresh implementation context without owner-capable routes;
selecting a different account here is insufficient. See [account isolation](automation-account-setup.md).

PR #15 remains owner-authored. After isolation and bounded feature-branch
capability verification, recreate the preparation draft as codexcodemachine,
verify its actual author/AI attribution and retain #15 until the replacement is
confirmed. Joshbomb75 must provide genuine independent human review. The agent
must never submit that review or weaken bootstrap protections.

## Exact main configuration and rationale

The [classic payload](milestones/evidence/phase-c/proposed-protection.json) remains
unchanged from the proposal at `94c03cb3c1e108660d29954bb277b15552143acb`.
An equivalent active ruleset is acceptable only if every required control can be
expressed and read back. **Apply to main only in this assignment.** No additional
branch targets, tags, merge queues or organization-wide changes.

| Control                     | Intended value                                                                                                        | Rationale                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Pull requests               | Required; no user/team/app PR bypass allowances                                                                       | Prevent direct acceptance of implementation work              |
| Required checks             | frontend, backend, windows-smoke, e2e, policy, supply-chain, quality-gate; each bound to GitHub Actions App **15368** | Retain every validation lane and the aggregate                |
| Existing checks/controls    | Union required checks and preserve stronger settings                                                                  | Prevent accidental relaxation                                 |
| Up-to-date branches         | strict=true                                                                                                           | Validate against the current protected base                   |
| Independent review          | One approval plus code-owner review                                                                                   | Require the designated human policy owner                     |
| Stale approvals             | Dismiss on new commits                                                                                                | Prevent old review authorizing changed work                   |
| Most recent reviewable push | Require approval by someone other than latest pusher                                                                  | Separate final push and approval                              |
| Review dismissal            | Joshbomb75 only; no team/app allowance                                                                                | Exclude implementation control of dismissal                   |
| Conversations               | Resolution required                                                                                                   | Retain unresolved review blockers                             |
| Administrators              | enforce_admins=true; no implementation bypass                                                                         | Retain normal PR/check/review requirements for administrators |
| Protected updates           | Joshbomb75 only; empty team/app lists; all PR/check/review requirements retained                                      | Reserve acceptance to the human merger                        |
| Force pushes/deletion       | Both disabled                                                                                                         | Protect accepted history and branch existence                 |
| Repository auto-merge       | Keep allow_auto_merge=false                                                                                           | Preserve deliberate owner merging                             |

App 15368 identifies a producer, not an independently trusted workflow definition.
Editable Actions code can emit misleading green results; independent policy
review remains essential. Keep quality-gate required: it accepts only explicit
success from all six dependencies and rejects skipped/cancelled outcomes. Green
CI alone does not establish required-check enforcement. Administrators can edit
rules, so their credentials must be excluded from the later implementation context.

Preserve proposed **`* @Joshbomb75`** in `.github/CODEOWNERS`: it covers every
existing/future file, including CODEOWNERS itself, CI, tests and standards. No
implementation principal is an alternative owner. The actual main tree currently
contains **no CODEOWNERS**. The proposal is not effective policy ownership.
GitHub CODEOWNERS validation is unavailable through this connector. Verify the
file, GitHub validation, owner eligibility and review requests on the actual base
after independently reviewed bootstrap. Never weaken review controls to accommodate
an owner-authored bootstrap PR.

## Administration capability and safe application

Fresh owner identity and Admin repository role do **not** establish app permission.
The managed connector explicitly excludes administration access; one fresh
detailed protection GET returns **403 Resource not accessible by integration**.
It exposes no protection/ruleset/repository-settings write operation. Effective
branch-rule and CODEOWNERS-error URLs are unsupported. Listed rulesets including
parents are `[]`; main reports protected=false and checks off. These establish
absence of reported active protection, not a complete settings export.

The current private cloud runtime has no ready outbound identities, secret
bindings or runtime variables. A bounded `gh api user` attempt through the normal
proxy returns Forbidden; `api.github.com` is absent from the enforced allowlist.
GH_TOKEN exists, but its value/identity/scope were never inspected. No denied
endpoint is repeatedly retried; no alternate host/proxy bypass is used. Public
Git fetch proves read connectivity only.

The minimum missing setup is a **supported owner administration route** that
authenticates Joshbomb75, reads complete classic protection and inherited/effective
rules, and writes/reads back every listed setting for this repository. Reconnecting
the same managed owner connector does not add its excluded capability. A supported
CLI route would also need authorized API networking and a ready, already-authorized
owner binding; none is configured here. Do not mint tokens, expand credential
permissions, change installations or use the owner's personal computer/browser.
If the platform cannot provide a route within those limits, report the exact gap
for a separately reviewed setup decision. Do not delegate individual settings entry.

When a supported route is available, the agent must:

1. Verify live account/ID and repository Admin role before using the connection.
2. Obtain complete existing classic protection and repository/inherited rulesets,
   including all rule details, targets, enforcement and bypass actors. A 403 is
   inaccessible, not absence; a 404 establishes absence only with confirmed
   authorized access. Retain UTC observation times and main SHA.
3. Compare every control with the table/payload, preserve stronger values and
   union existing checks with the seven App-bound checks. Do not replace settings
   from partial/inaccessible readback. Record any expression gap without substituting
   weaker controls.
4. Apply reconciled **main-only** settings using the verified owner route. Keep
   auto-merge disabled. Do not change access, other targets or merge methods.
5. Read back effective configuration and compare every row. Retain UTC times,
   classic/ruleset IDs, branch SHA, required names/source IDs, strictness, all review
   and dismissal settings, update restrictions, force/deletion controls, admin
   enforcement and all bypass lists. A successful write is insufficient; unavailable
   fields remain Unverified.

## Disposable target and future probes

The only permitted future target is **codex/m0-phase-c-target**. The complete
branch listing contains no such branch; its actual initial SHA is **Unassigned**.
Do not create/advance it or configure its protections in this assignment. Reviewed
source SHA, creation, precise scope and equivalent protections require separate
authorization. Its source must contain CODEOWNERS and the existing target CI
trigger; record the actual initial SHA when creation is authorized.

The [serial probe ledger](milestones/milestone-0-phase-c-probes.md) is preparation
only. No mutation/destructive probe runs here. Future ready PRs use only
`codex/m0-phase-c-probe/<id>` → `codex/m0-phase-c-target`. C15b requires a valid,
independently reviewed advance PR and a separately authorized **owner merge under
all target protections**. Never substitute direct push, rule relaxation or bypass;
never merge a deliberate defect.

Every future case records exact head/base/tested merge SHAs, isolated mutation,
expected diagnostic, individual/aggregate conclusions, review and remote push
actors, effective settings, merge-block reason, unchanged refs where applicable,
and retained evidence. Drafts, conflicts, unrelated failures, pending runs, missing
approval, generic credential/network denials and failed leases may mask the intended
control. Attribute detection and enforcement separately; masked cases stay Unverified.

## Recovery, exceptions and completion

For failed CI, retain diagnostics, fix on the feature branch and validate the new
SHA. Never replace required checks with manual success or call unavailable
advisories clean. Retain sanitized summaries, hashes and immutable links before
seven-day expiry; never retain credentials or raw secret findings.

If a future prohibited target operation succeeds, stop, retain sanitized commands,
responses and before/after refs, notify the owner and leave main untouched. The
owner investigates/restores the pinned known-good target. The agent must not
force-reset/recreate it to conceal the result. Resume only after reviewed correction
and renewed precise authorization where needed.

For compromised credentials, stop. The owner revokes/rotates them outside the
agent context, inspects changed refs/rules/audit evidence, re-establishes isolation
and repeats affected checks. Never collect tokens as evidence. Use GitHub's owner
recovery/support for lost owner access; no standing agent emergency bypass.

Exceptions follow [engineering standards](engineering.md): exact rule/scope,
rationale, independent reviewer/accountable owner, approval evidence, expiry and
removal/retest plan. Register: **none**. Missing evidence and unsatisfied controls
are blockers, not exceptions or accepted results.

Recommend owner merge only after automation-authored replacement, genuine independent
bootstrap/policy review, exact-head CI and complete configuration readback. This
assignment authorizes no merge. M0 completion additionally requires C1–C6 and the
independently observed full probe matrix, owner acceptance and any separately
authorized merge. The exact resulting main SHA must pass all seven checks; recheck
protections and base CODEOWNERS, retain evidence and refresh the cloud baseline.
