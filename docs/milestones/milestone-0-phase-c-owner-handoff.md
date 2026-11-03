# Milestone 0 — bounded closeout owner handoff

The owner approved this narrower scope in chat on November 2, 2026
(America/Los_Angeles), then instructed the agent to proceed. This handoff replaces
the old identity-isolation, protected-target and 31-probe prerequisite sequence.
See the [current report](milestone-0-closeout-report.md) and
[revised acceptance criteria](milestone-0.md#revised-phase-c-acceptance-criteria).

## 1. Confirm existing main settings once

No repeated settings write is requested. From GitHub's main protection settings,
provide a current capture/export confirming PRs, up-to-date validation, human and
code-owner review, stale/latest-push approval behavior, conversation resolution,
force/deletion blocking and existing stronger restrictions. The connector already
reports all seven required checks from GitHub Actions App 15368; detailed reads
return 403. If using an existing owner-authenticated CLI, this read-only command
produces the classic protection configuration (do not include credentials):

```bash
gh api repos/Johnson-Dev-Agent-Management/project-manager/branches/main/protection
```

If rulesets supply the controls, include the active rulesets instead. Preserve
stronger settings and do not weaken review to accommodate the owner-authored #15.
No new account, credential, paid service or disposable protected target is needed.

## 2. Review the bot-authored closeout PR

The replacement preserves #15's changes, including the Node 26/npm 12 Windows
setup correction, and adds the explicitly revised M0 scope and ten exact historical
Gitleaks fingerprints. Check the final head's seven job results, CODEOWNERS
bootstrap, scanner classification/expiry and moderate-advisory triage in the report.
The owner can approve the bot-authored PR; the agent must not supply that review.
Keep #15 until replacement content is confirmed, then retire it as superseded.

## 3. Merge and validate main

After actual approval and green required checks, the owner performs any merge.
Verify all seven jobs on the resulting main SHA, main's protections and actual
base CODEOWNERS eligibility/review behavior. Refresh the private cloud baseline.
Record owner acceptance in the closeout report/PR before calling M0 complete.
The next assignment can then build a product feature with its acceptance criteria
and regression tests. Deployment remains a later feature.

## Known limits

No claim of complete owner/agent credential isolation, bypass resistance,
exhaustive deliberate-defect testing, or automatic delivery is made. Those are
explicitly deferred, not failed requirements that must be completed before M0.
Detailed protection confirmation and post-merge validation remain real closeout
requirements. Current CI success alone does not satisfy them.
