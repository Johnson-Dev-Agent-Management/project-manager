# Milestone 0, Phase B acceptance report

Status: **Incomplete — implementation validation in progress.**
Implementation type: AI
Implementation author: Codex Cloud

Starting main: `688c1bd6c5fdbc5470b0c24abb41e3380a882a86` (merged Phase A PR #6).
Single implementation agent; owner has authorized Phase B and CI execution.
Independent reviewer: owner/designated human; review not run.

This report will record the exact tested head/merge SHA and CI evidence after
validation. See [standards](../engineering.md) and [CI operation](../ci.md) for
protected-policy changes, coverage scope, commands, and exception rules.

| Requirement | Outcome | Evidence                                      |
| ----------- | ------- | --------------------------------------------- |
| B1          | Not run | Final verification pending                    |
| B2          | Not run | Final verification pending                    |
| B3          | Not run | Ten consecutive full E2E executions pending   |
| B4          | Not run | Final security/static analysis pending        |
| B5          | Not run | Human review pending; no operative exceptions |
| B6          | Not run | Reproducible final evidence pending           |

Baseline locally reproduced from main before changes: 3 frontend tests,
4 backend cases, 17 Python tests; frontend 96% lines (24/25), 75% branches (18/24);
backend 100% lines (17/17), 75% branches (3/4). No baseline thresholds existed.

Initial Phase B npm audit failed for transitive undici 8.11.2:
GHSA-xjj6-f33q-929c (high), GHSA-4qv8-2p9j-2685 and GHSA-f72v-6w45-q472 (moderate).
A compatible lock update fixes these; no advisory suppression is proposed.

Inherited risks: GitHub reports public visibility and an admin-capable connector;
neither was changed. Independent review/identity separation and Phase C controls
are not established. Cloud release-asset downloads are currently blocked by its
network allowlist; local actionlint/ShellCheck/Gitleaks execution remains Not run
until downloads are available. CI will run the pinned tools on hosted runners.

Initial reliability qualification correctly stopped on run 2 when port preflight
rejected TIME_WAIT sockets after successful cleanup. The fix uses reusable socket
binding plus listen to reject live listeners; two real-socket regressions verify
occupied-listener safety and reuse after closure. A later local qualification was
invalidated while its shell script was being edited, so neither attempt is counted
as the required ten-run pass. Final qualification will restart from run 1.

The first hosted policy check failed on ShellCheck SC2329 for dev cleanup; cleanup
is now explicitly invoked on the normal exit path as well as through its trap.
No ShellCheck rule is suppressed. The temporary ESLint 9 compatibility selection
was replaced with the baseline ESLint 10 and the explicitly compatible pinned
HTML Academy accessibility fork; unsupported ESLint is not retained.
