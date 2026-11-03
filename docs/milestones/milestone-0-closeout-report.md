# Milestone 0 — CI-focused closeout report

Status: **Implementation prepared; owner review, detailed protection readback
and post-merge validation remain pending.**

Implementation type: AI
Implementation author: Codex Cloud

## Scope and authorization

On November 2, 2026 (America/Los_Angeles), the owner accepted the bounded closeout
plan and instructed the agent to proceed. The current [milestone plan](milestone-0.md)
replaces account-isolation certification and the exhaustive enforcement ledger
with representative regression exercises. Required checks, 80% line/70% branch
floors per codebase, real SQLite and production browser tests, security blocking
thresholds, report integrity and human policy review remain intact.

Implementation starts from #15 head `c1da6702a9304560997b5a93269628f76e4c5c73`,
with main at `0a923d420c3e7c22b339c193e7ce8e14e73d03b6`. It preserves the other
session's Node 26.13.0/npm 12.2.1 setup correction and CODEOWNERS proposal. The
bot connection identifies codexcodemachine / 348095294. API publication and bot
PR authorship permit owner review; they do not certify Git credential isolation.
No settings, credentials, protected branches, human reviews or merges are changed.

## Narrow scanner disposition

The ten entries in [`.gitleaksignore`](../../.gitleaksignore) are copied exactly
from the previously prepared fingerprint proposal. Each specifies the historical
commit `f21a64a6d4d858afd6fb825bc99523414a82adf0`, file, generic-api-key rule and
line. There is no broad path/rule/hash exemption and no history rewrite.

The original api-production archive, artifact **12792495601** from
[run 40632431988](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40632431988),
was downloaded again. Its SHA-256 matched the recorded API digest. Recomputed
hashes of the five flagged output files matched the historical provenance values;
the five duplicate locations in the second evidence file matched exactly. These
are build-file digests, not credentials. The original files were read from Git
history without printing any credential material.

| Disposition field                              | Value                                                                                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope                                          | Exactly ten historical commit/path/rule/line fingerprints; five hashes duplicated across two files                                                  |
| Authorization                                  | Owner's approval of the described bounded closeout and instruction to proceed in this chat                                                          |
| Independent human reviewer / accountable owner | Joshbomb75; actual PR review remains pending, not self-granted by the agent                                                                         |
| Risk                                           | Misclassification would hide only those exact historical findings; new locations/commits remain scanned                                             |
| Review/renewal deadline                        | 2026-11-10T00:00:00Z (November 9, 4 p.m. Pacific); expired exceptions fail the definition of done                                                   |
| Retest/removal                                 | Run full-history and tracked-tree scans at the final head; remove only if no longer applicable, otherwise explicitly review renewal at the deadline |

The owner authorized activation on the implementation branch. Integration into
main remains subject to independent PR review. `scripts/security.sh`, full-history
`--all`, working-tree scanning, upstream rules, redaction and failure propagation
are unchanged. The date is a documented review requirement, not an automated
expiry check. Historical reports saying the proposal is inactive are dated
snapshots and carry a current-report pointer.

## Dependency triage

The latest #15 audit reported 14 moderate npm package findings rooted in
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), with zero
high/critical findings. These counts include dependent tooling packages, not 14
independent root vulnerabilities. The affected minimatch paths are development
lint/parser tooling, not the React runtime dependency path. Crafted glob patterns
can consume excessive resources when that tooling processes input, including
untrusted PR/configuration changes; development-only is not a claim of no risk.
Hosted jobs retain their existing timeouts and read-only execution permissions.

The setup report found no compatible upstream fixed release on the affected
major lines. Keep supported tooling and track compatible upstream updates through
Dependabot; do not force an incompatible major override or downgrade linting.
A fresh `npm audit --omit=dev --json` also returned zero findings in the
production dependency set. `npm ls minimatch --all` confirms the affected paths
through ESLint/config-array, TypeScript ESLint tooling and the accessibility plugin.
Owner/reviewer: Joshbomb75. Proposed disposition: retain the existing moderate
triage policy and review this exposure with the closeout PR; no high/critical or
advisory-access exception is granted. Refresh advisories in final hosted CI.

## Validation

Exact final head, tested merge, workflow/job links and hosted conclusions are
recorded in the bot-authored closeout PR after publication. Earlier #15 run
[41567726668](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/41567726668)
is a verified historical failure: frontend/backend/Windows/policy/E2E passed,
supply-chain failed on ten findings and quality-gate propagated that failure.
It is not final-head validation.

Local setup passed; the complete check script passed both before and after restoring
the temporary exercises:
13 frontend, 10 backend and 29 Python tests. The exercised source mutations are
never published; source is restored byte-for-byte before final validation.
[Representative exercise evidence](evidence/phase-c/closeout-probes.md): a real
frontend assertion fails (1 failed / 4 passed), removing blank-name validation
fails three unchanged backend cases (1 passes), and five existing report tests
verify coverage/integrity plus the workflow aggregate's 24 negative combinations.
Source restoration is verified. These are detection results, not GitHub merge
eligibility. The initial frontend probe command used the wrong working directory;
that infrastructure failure was discarded and the corrected invocation is recorded.

`bash scripts/policy.sh` remains locally blocked at the pinned actionlint download
(HTTP 403 under the restricted release-download policy). Repository Prettier, changed-document link validation, exact-fingerprint validation
and `git diff --check` pass. Frontend coverage remains 31/32 lines and 24/24
branches; backend remains 18/18 lines and 3/4 branches, above independent 80/70
floors. Local standalone policy binaries and Gitleaks scans are Not run; hosted CI remains the validation path.
No network-policy bypass or scanner substitution is used.

## Acceptance and owner actions

| Criterion | Current status                                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1        | Partly verified: main protected and seven App 15368 checks confirmed; detailed PR/review/up-to-date settings require owner readback                       |
| C2        | Bot identity verified; replacement authorship verified after PR creation; actual owner review pending; isolation certification deferred                   |
| C3        | Checks/thresholds preserved and whole-repository CODEOWNERS retained; independent bootstrap review and actual-base behavior pending                       |
| C4        | Detection exercises passed; historical hosted aggregate failure verified; server-side merge enforcement still requires current configuration confirmation |
| C5        | Exact false-positive classification verified and authorized; final scans and human review/triage pending                                                  |
| C6        | Owner approval/merge, resulting-main validation and acceptance pending                                                                                    |

Follow the [three-step owner handoff](milestone-0-phase-c-owner-handoff.md).
Do not mark M0 complete before owner acceptance and green resulting-main CI.
No product features, account-isolation certification or deployment work is added.
