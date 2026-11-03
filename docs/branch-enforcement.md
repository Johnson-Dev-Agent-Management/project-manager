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
- Land `.github/CODEOWNERS` with `* @Joshbomb75` through the reviewed bootstrap.
  It covers current/future files and itself; it governs later PRs only once on
  their actual base with code-owner review enabled.

## Current evidence and limits

Main `0a923d420c3e7c22b339c193e7ce8e14e73d03b6` reports protected=true and all seven
checks bound to App 15368. The connector cannot read detailed branch protection
(403 Resource not accessible by integration). Required PR/review/up-to-date and
bypass settings need the owner's current settings capture/export. A required
check name and producer do not authenticate the workflow implementation; human
review of CI/tests/thresholds remains necessary.

Use codexcodemachine for publication and PR authorship, and Joshbomb75 for actual
human review and merging. A new bot-authored closeout PR includes the latest #15
content plus bounded closeout changes. Account isolation is not a prerequisite.
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

After owner merge, verify all seven checks on the resulting main SHA, actual
base CODEOWNERS eligibility/review behavior, and refresh the private cloud baseline.
The [owner handoff](milestones/milestone-0-phase-c-owner-handoff.md) is the remaining
checklist; the old account-isolation/probe packages are historical guidance only.
