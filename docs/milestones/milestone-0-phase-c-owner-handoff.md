# Milestone 0 — remaining housekeeping

The owner-approved implementation is merged through [PR #16](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/16).
Joshbomb75's approval covers head `2b069f54e6bae5333c0e679c1778cc16e914018f`;
all seven checks pass on resulting main `0e6b05f350b5f2a5b90b07414e8e113093d80360`
([post-merge run](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/41577510318)). PR #15 is closed.
See the [current report](milestone-0-closeout-report.md) for evidence and limits.
Do not repeat the completed approval, bootstrap merge or startup-regression work.

## 1. Protection verification — completed

The owner supplied the current main-protection API response. The
[normalized export](evidence/phase-c/main-protection-owner-readback.json) confirms
strict/up-to-date checks; one approving human review; Code Owners; stale/latest-push
approval; conversation resolution; administrator enforcement; blocked force pushes
and deletion; and owner-only push/review-dismissal lists. All seven required
checks are bound to GitHub Actions App 15368, also corroborated by connector readback.
CODEOWNERS is on the merged base and names Joshbomb75 for all files.

The connector's detailed read remains HTTP 403; the evidence source is the owner,
not a direct connector fetch. The export omits the bypass-allowances field, which
is not invented. No settings change or further account-isolation probe is needed
for the agreed supervised scope. **M0 closeout verification is complete.**

## 2. Keep the scanner review date

[Issue #17](https://github.com/Johnson-Dev-Agent-Management/project-manager/issues/17) is assigned to Joshbomb75 and tracks review by
**November 9, 2026 at 4 p.m. Pacific** (`2026-11-10T00:00:00Z`). It records the
exact ten historical false positives, removal/renewal decision and retesting steps.
This housekeeping does not extend the deadline or broaden any exclusion. The
issue is a tracking record; it does not configure a scheduled notification.

## 3. Start feature work from current main

This private cloud checkout was refreshed from merged main; the saved cloud image
was not republished. New sessions should fetch current main, run setup/checks, and
implement a bounded feature with observable acceptance criteria and meaningful
regression tests. Preserve the seven required checks, coverage floors and human
policy review. Open a draft PR and leave merging to the owner.

Account-isolation certification, exhaustive adversarial probes, automatic merging
and deployment remain deferred. No additional infrastructure implementation phase is required before assigning
a product feature. The scanner review is ongoing maintenance, not unfinished M0
implementation.
