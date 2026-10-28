# Phase C verification ledger

Status: **Not run; all Phase C probe outcomes Unverified.**
The agent now uses only codexcodemachine; owner-only main administration is
handed off to the owner session. Main settings remain approved. Equivalent target
settings, reviewed source SHA, creation and precise probe scope still require
separate authorization. No disposable target exists; its initial SHA is unassigned.
Fresh isolated implementation credentials, recreated implementation PR, exact
pinned probe scope and complete effective configuration readback are prerequisites.
Do not interpret this planned
matrix, historical Phase A/B failures, or draft-PR CI as successful enforcement.
See [owner approval and recovery](../branch-enforcement.md).

## Execution contract

Target: **codex/m0-phase-c-target** only. Source branches:
**codex/m0-phase-c-probe/cXX** (suffix subcases when needed). All verification PRs
must be **ready/non-draft**. The implementation deliverable PR stays draft.
Each defect is isolated from the known-good approved target SHA; do not accumulate
unrelated mutations. Never merge a deliberate defect, invoke merge to test a block,
or force-push/delete main. No disposable branch/rule exists by assumption.

Before execution, fill these fields with owner approval evidence:

- Main settings approval: current owner assignment, exact controls documented in
  [the configuration package](../branch-enforcement.md). Main owner-session administration is
  approved; the agent cannot perform administration through the current connector; this does not authorize
  target creation, target configuration or any mutation/destructive probe.
- Target settings/creation approval: **Pending**, including reviewed source SHA
  and precise scope. Historical two-branch proposal `94c03cb` is not that approval.
- Exact probe operations and destructive execution authorization: **Pending**;
  no broad settings approval is treated as a destructive-probe go-ahead.
- Approved Phase C source SHA / initial target SHA: **Unassigned / Unassigned**.
- Target protection readback and observed time: **Unverified**.
- API principal: **codexcodemachine, ID 348095294, verified**; collaborator Write,
  admin=false, maintain=false, reported organization memberships []. Full credential
  scope/bypass remains Unverified. Actual authenticated Git push actor and replacement
  PR author: **Unverified**; existing #15 remains Joshbomb75-authored.
- Independent human reviewer / owner merger: owner-confirmed **Joshbomb75**;
  implementation API connection **Codex GitHub / codexcodemachine** is present.
- Credential separation in a fresh implementation context and absence of
  owner-capable routes/bypass: **Unverified**. Owner account selection remains advertised but is not invoked
  in this continuation; this does not establish C2. Git push/workflow-comment/draft-PR capability verification
  remains Not run until supported isolation prerequisites hold.

For every row, Actual is **Not run**, head/base/tested merge SHAs are **—**,
CI/PR/mergeability links are **—**, and enforcement outcome is **Unverified**.
These defaults are explicit missing evidence, not empty successful results.
Create a per-case record using the template below when the prerequisites hold.
For rows with multiple subcases, execute and record each subcase independently.

| ID   | Isolated change or operation                                                                                                              | Expected result and required attribution evidence                                                                                                                                                                                                                                          |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C01  | Valid small application change plus meaningful tests                                                                                      | All seven checks succeed; missing independent approval blocks first; after human/code-owner approval, owner observes eligibility, with no merge performed                                                                                                                                  |
| C02  | Documentation-only change                                                                                                                 | All seven named required checks actually appear and complete; no path-filter gaps                                                                                                                                                                                                          |
| C03a | Add an actual TypeScript assignment error                                                                                                 | Frontend typecheck and quality-gate fail with the expected compiler diagnostic                                                                                                                                                                                                             |
| C03b | Add C# compiler violation; separately add analyzer violation                                                                              | Backend and quality-gate fail with the specific compiler/analyzer diagnostic; not merely formatting                                                                                                                                                                                        |
| C04a | Add a failing frontend assertion                                                                                                          | Frontend and quality-gate fail; assertion name and expected/actual output retained                                                                                                                                                                                                         |
| C04b | Add a failing backend assertion                                                                                                           | Backend and quality-gate fail; TRX/test failure retained                                                                                                                                                                                                                                   |
| C05  | Remove server blank-name validation without changing tests                                                                                | Existing backend and browser validation assertions fail. E2E normally skips after backend failure: run the unchanged browser scenario separately against production builds of this SHA to demonstrate browser detection, recording the explicit command/run; do not remove CI dependencies |
| C06a | Break UI submission, preserve backend and tests                                                                                           | Browser fails actual creation assertion even if mocked unit tests pass; do not adjust tests to hide failures                                                                                                                                                                               |
| C06b | Break SQLite persistence across API restart                                                                                               | Backend restart and real browser restart assertions detect it; as with C05, separately run browser if backend failure masks E2E                                                                                                                                                            |
| C07a | Change npm manifest without lock update                                                                                                   | `npm ci` rejects mismatch; relevant jobs and aggregate fail                                                                                                                                                                                                                                |
| C07b | Change NuGet manifest without lock update                                                                                                 | Locked restore rejects mismatch; aggregate fails                                                                                                                                                                                                                                           |
| C08a | Introduce untested frontend executable branches below floor                                                                               | Frontend coverage gate fails at approved 80% line / 70% branch floor; record measured scope/counts                                                                                                                                                                                         |
| C08b | Introduce untested backend executable branches below floor                                                                                | Backend report gate fails at approved floor, without exclusions or threshold edits                                                                                                                                                                                                         |
| C09a | Focus a test; separately skip a test                                                                                                      | Focus/skip lint/runtime/report integrity rejects each applicable frontend/backend/browser/Python subcase, no empty green run                                                                                                                                                               |
| C09b | Remove discovery pattern; separately leave an empty discovered module                                                                     | Missing pattern/module integrity rejects each subcase; Python per-module empty-suite follow-up exercised                                                                                                                                                                                   |
| C09c | Omit required frontend/backend/browser report in separate cases                                                                           | Report/inventory check fails for each missing report                                                                                                                                                                                                                                       |
| C10  | Prevent API startup on the E2E target port                                                                                                | Readiness fails within documented bound; logs/diagnostics retained, only owned processes removed; ports released                                                                                                                                                                           |
| C11a | Cancel required workflow/job with an approved available actor                                                                             | Cancelled/missing required result blocks ready PR; not draft status. If cancellation tool is unavailable, owner cancels and records actor/time                                                                                                                                             |
| C11b | Skip required job in disposable workflow change                                                                                           | `quality-gate` fails explicit-success check; skipped job alone is not assumed blocking                                                                                                                                                                                                     |
| C12a | Replace checks/tests with no-op green results                                                                                             | Independent human/code-owner approval is absent/withheld and prevents acceptance despite green named checks; record reviewDecision/UI reason                                                                                                                                               |
| C12b | Lower coverage thresholds                                                                                                                 | Same independent policy-review block; expected-source binding alone cannot distinguish altered Actions code                                                                                                                                                                                |
| C13a | Modify CODEOWNERS to add implementation principal                                                                                         | Target-base CODEOWNERS still requires independent owner review; changed head ownership does not govern the PR                                                                                                                                                                              |
| C13b | Remove CODEOWNERS                                                                                                                         | Target-base CODEOWNERS still governs; missing independent approval blocks ready PR                                                                                                                                                                                                         |
| C14  | Attempt to publish same required context from a non-Actions source on probe head only                                                     | Wrong source is rejected/ignored for required check; actual source and App IDs retained. Use only explicitly approved existing credentials with status permission; unavailable credentials/tooling means Unverified, never mint or elevate credentials for this                            |
| C15a | Push new valid commit after human approval                                                                                                | Stale approval dismissed; last-push approval needed; record old/new head, approval commit, pusher, and blocked review state after new checks pass                                                                                                                                          |
| C15b | Advance disposable target through a valid, independently reviewed PR and separately authorized owner merge while another valid PR is open | Strict up-to-date requirement blocks stale PR until base validation refreshes; no direct push/bypass/main advance. Owner merges only the independently reviewed valid advance PR with separate authorization; otherwise Pending. The stale PR is not merged                                |
| C16a | Fast-forward direct target update with implementation credentials                                                                         | Rejected for protected-branch access/PR requirements; capture remote response and unchanged target SHA                                                                                                                                                                                     |
| C16b | Non-fast-forward target update with implementation credentials                                                                            | Rejected for intended protection; pin expected old SHA and approved known-good destination. Never substitute a failed lease as force-push protection evidence                                                                                                                              |
| C16c | Delete disposable target with implementation credentials                                                                                  | Rejected for intended protection; unchanged ref. Never attempt main deletion                                                                                                                                                                                                               |
| C17  | Add a conspicuously synthetic, nonfunctional Gitleaks fixture on a probe branch                                                           | Redacted scanner detects fixture and supply-chain/aggregate fail; never use real secret material or a live credential. Historical fixture commit stays off target/main                                                                                                                     |
| C18  | Make advisory retrieval unavailable using branch-scoped invalid source/proxy in the probe run                                             | Security job fails/incomplete with exact unavailable-service diagnostic, not clean; do not change global network policy or suppress audit warnings                                                                                                                                         |

C16b must be a real non-fast-forward relative to the recorded target, such as a
reviewed ancestor SHA, with an exact expected-old lease; do not force-push a defect
tree. C16a uses a known-good harmless commit, not a deliberate defect. A transport
denial, insufficient generic credential scope, or failed lease does not demonstrate
GitHub branch enforcement. Record them accurately and leave the protection
**Unverified**. If any ref changes, stop and follow owner recovery immediately.

C14 cannot pass merely because the spoof API is inaccessible. If all legitimate
checks also succeed, the spoof's irrelevance does not prove source enforcement;
isolate the source-binding observation without weakening the protected target or
altering main. Unavailable independent observation means **Unverified**.

For all merge-block probes, retain the effective settings and UI/API reason for
the exact ready PR head. A pending CI run, draft state, merge conflict, unrelated
failed test, push restriction, or absent human approval may mask the control being
tested. Resolve unrelated prerequisites using only valid changes/real human
approval where authorized; otherwise report the masked control **Unverified**.
Never approve a known defect to make an attempted merge probe possible. CI
failure plus gate evidence can establish defect detection while merge-block
attribution remains separately Unverified.

## Probe acceptance status

All cases and every grouped subcase below are **Unverified**, with no executed
head/base/tested SHA or enforcement result. Current preparation CI is not a
disposable-target probe. Complete identity isolation, approved target creation/
equivalent configuration and independent readback before requesting exact-scope
execution authorization. None of that authorization is implied by this handoff.

| Probe | Status     | Reason / next action                                                                                                                                                    |
| ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C01   | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C02   | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C03a  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C03b  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C04a  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C04b  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C05   | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C06a  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C06b  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C07a  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C07b  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C08a  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C08b  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C09a  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C09b  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C09c  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C10   | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C11a  | Unverified | Cancellation scope/actor not authorized; identify a supported actor and exact target-only cancellation after prerequisites                                              |
| C11b  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C12a  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C12b  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C13a  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C13b  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C14   | Unverified | No approved source-spoof actor/scope; identify an existing permitted source and independently observable source-binding test after prerequisites                        |
| C15a  | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C15b  | Unverified | No target or owner-merge authorization; approve a reviewed valid advance PR and separate owner merge after all prerequisites                                            |
| C16a  | Unverified | Protected-ref mutation/destructive scope not authorized; pin known-good destination/expected-old SHA and authorize exact target-only operation after isolation/readback |
| C16b  | Unverified | Protected-ref mutation/destructive scope not authorized; pin known-good destination/expected-old SHA and authorize exact target-only operation after isolation/readback |
| C16c  | Unverified | Protected-ref mutation/destructive scope not authorized; pin known-good destination/expected-old SHA and authorize exact target-only operation after isolation/readback |
| C17   | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |
| C18   | Unverified | Target/source/scope and isolation prerequisites missing; complete them and authorize this isolated case before execution                                                |

Per-case detection and enforcement must be reported separately. A failed test
may prove detection while its merge blocker remains masked; network/credential
denials and failed leases do not prove branch enforcement.

## Per-case evidence record (copy for each execution)

```text
Case ID:
Defect/capability detection outcome: Passed / Failed / Unverified
Protection enforcement outcome: Passed / Failed / Unverified
Owner approval reference and scope:
Observed at (UTC):
Implementation push/API identities and credential-scope evidence:
Independently observable remote push actor and evidence source:
Independent observer/reviewer:
PR URL and draft=false evidence (or N/A for ref-only operations):
Target name and effective protection evidence:
Exact mutation/command (no credentials):
Base SHA before/after:
Head SHA before/after:
Tested merge/workflow SHA:
Expected result:
Actual result and sanitized error/assertion:
CI run/job links and individual conclusions:
Aggregate quality-gate conclusion and expected diagnostic:
Approval actor/commit and most recent reviewable-push actor:
ReviewDecision/mergeStateStatus or equivalent UI evidence:
Exact merge-block reason, observation time and unchanged-ref evidence:
Intended protection versus other blockers:
Diagnostics retained, artifact expiry and durable evidence path:
Cleanup (PR closed, no merge; branch disposition):
Remaining limitations / retest required:
```

No new Phase C probe has an actual commit, CI link, independent approval or
mergeability observation yet. The [report](milestone-0-phase-c-report.md)
separately records historical prerequisites and the implementation draft's CI.
