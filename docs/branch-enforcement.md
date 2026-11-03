# Branch enforcement — supervised M0 closeout

The owner approved the [bounded CI-focused scope](milestones/milestone-0.md#phase-c--bounded-ci-closeout)
on November 2, 2026 (America/Los_Angeles). Complete credential isolation and the
old exhaustive enforcement matrix are deferred. Existing protections are retained;
this scope change does not authorize settings changes or bypasses.

## Required controls

- Require PRs and all seven checks: **frontend, backend, windows-smoke, e2e,
  policy, supply-chain, quality-gate**, each from GitHub Actions **App 15368**.
- Require the branch to be up to date, genuine human approval, and code-owner
  review. Retain stale-approval dismissal, latest-push approval by someone other
  than the pusher, conversation resolution, and existing stronger restrictions.
- Retain force-push/deletion blocking, administrator enforcement, owner-controlled
  merging, and disabled auto-merge. Do not weaken settings to accommodate authorship.
- Preserve `.github/CODEOWNERS` with `* @Joshbomb75`, now on main after the reviewed
  bootstrap. It covers current/future files and itself. The owner-provided
  protection export confirms required code-owner review.

## Current evidence and limits

Main `0e6b05f350b5f2a5b90b07414e8e113093d80360` reports protected=true and all seven
checks bound to App 15368. The connector cannot read detailed branch protection
(HTTP 403), so the owner supplied the current API export. The retained
[normalized readback](milestones/evidence/phase-c/main-protection-owner-readback.json)
confirms strict/up-to-date checks, one approving review, code-owner review,
stale-approval dismissal, last-push approval, conversation resolution, administrator
enforcement, force/deletion blocking, and owner-only push/review-dismissal lists.
The omitted bypass-allowances field is not invented; exhaustive bypass
certification remains outside the agreed scope. A required
check name and producer do not authenticate the workflow implementation; human
review of CI/tests/thresholds remains necessary.

Use codexcodemachine for publication and PR authorship, and Joshbomb75 for actual
human review and merging. [PR #16](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/16) is approved by
Joshbomb75 and merged, including #15's work and the prepared-runtime startup fix.
PR #15 is closed. Account isolation is not a prerequisite.
The agent must never submit the owner's approval. No defective branch is merged,
no protected target is created or mutated, and no destructive probe is needed.

## Verification and recovery

The [closeout report](milestones/milestone-0-closeout-report.md) records temporary
local regression exercises and final hosted results. Test rejection and aggregate
failure are distinct from GitHub merge enforcement. Draft status, unrelated
failures or missing approval do not prove a specific check blocks merging.

If a job fails, inspect the failing job and retain diagnostics; fix the cause and
rerun against the final head. Do not remove required checks, lower floors, expand
exclusions or bypass review to recover green. Review exact scanner false positives
under the engineering exception rules. Future pipeline changes receive the same
human policy review and relevant negative validation.

All seven checks passed on the resulting main SHA ([run](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/41577510318));
CODEOWNERS is present on that base. The current private checkout was refreshed
from this main commit; no saved cloud image/configuration was republished.
Detailed code-owner/PR/review/up-to-date settings are confirmed by the owner
export. These observations complete the agreed supervised M0 verification.
The [owner handoff](milestones/milestone-0-phase-c-owner-handoff.md) is the remaining
checklist; the old account-isolation/probe packages are historical guidance only.
