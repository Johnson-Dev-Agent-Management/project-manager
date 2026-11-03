# Milestone 0 — CI-focused closeout report

Status: **Complete for the agreed supervised-development scope. Owner approval,
merge, green post-merge CI and required protection settings are verified.**

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
The agent did not change settings/credentials or submit the human review/merge.
Joshbomb75 [approved PR #16](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/16#pullrequestreview-5747224859) at head
`2b069f54e6bae5333c0e679c1778cc16e914018f` and merged it on November 2, 2026,
at 8:20 p.m. Pacific. Resulting main is `0e6b05f350b5f2a5b90b07414e8e113093d80360`.
PR #15 is closed. The prepared-runtime startup regression was fixed before approval;
its new test reproduced exit 127 before the fix and passes afterward.

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

| Disposition field                              | Value                                                                                                                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope                                          | Exactly ten historical commit/path/rule/line fingerprints; five hashes duplicated across two files                                                                                                |
| Authorization                                  | Owner's approval of the described bounded closeout and instruction to proceed in this chat                                                                                                        |
| Independent human reviewer / accountable owner | Joshbomb75; [approved PR #16 at the final head](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/16#pullrequestreview-5747224859)                                             |
| Risk                                           | Misclassification would hide only those exact historical findings; new locations/commits remain scanned                                                                                           |
| Review/renewal deadline                        | November 9, 2026 at 4 p.m. Pacific (2026-11-10T00:00:00Z); [issue #17](https://github.com/Johnson-Dev-Agent-Management/project-manager/issues/17); expired exceptions fail the definition of done |
| Retest/removal                                 | Run full-history and tracked-tree scans at the final head; remove only if no longer applicable, otherwise explicitly review renewal at the deadline                                               |

The owner authorized activation on the implementation branch, then approved and
merged PR #16 including the exact exclusions. The existing deadline is unchanged;
this housekeeping neither renews nor broadens the exclusion. `scripts/security.sh`, full-history
`--all`, working-tree scanning, upstream rules, redaction and failure propagation
are unchanged. The date is a documented review requirement, not an automated
expiry check. Historical reports saying the proposal is inactive are dated
snapshots and carry a current-report pointer.

## Dependency triage

The approved closeout and resulting-main audits reported 14 moderate npm package findings rooted in
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
Owner/reviewer: Joshbomb75. The documented disposition was included in the
approved closeout PR: retain the moderate triage policy and compatible upstream
update path. No high/critical or advisory-access exception is granted. Every
subsequent CI run refreshes advisory data; prior clean results are not perpetual.

## Validation

### Accepted merge and main validation

| Evidence              | Verified result                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner review          | [Joshbomb75 approved](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/16#pullrequestreview-5747224859) final PR head `2b069f54e6bae5333c0e679c1778cc16e914018f`            |
| PR validation         | [Run 41576037814](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/41576037814), all seven jobs passed; tested merge `fecfe7e369add49decc2b4155b54619c8b796755`     |
| Owner merge           | [PR #16](https://github.com/Johnson-Dev-Agent-Management/project-manager/pull/16) merged by Joshbomb75; resulting main `0e6b05f350b5f2a5b90b07414e8e113093d80360`                               |
| Post-merge validation | [Push run 41577510318](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/41577510318), all seven jobs passed on that exact main SHA                                  |
| Quality gate          | [Job 125725458801](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/41577510318/job/125725458801) records the same head/tested SHA and success for every dependency |
| Required checks       | Main reports protected=true; all seven required names bound to GitHub Actions App 15368                                                                                                         |
| Policy ownership      | `.github/CODEOWNERS` on main contains `* @Joshbomb75`; owner export confirms required code-owner review                                                                                         |

Final application/tooling counts are **13 frontend, 10 backend and 30 Python tests
(53 total)**. Windows native bootstrap, repeated setup/build and ten consecutive
production-output browser persistence executions pass. History and tracked-tree
secret scans pass; no security threshold was changed. The final PR and main runs
supersede #15's earlier failed security snapshots.

The private checkout was refreshed from the merged main commit for housekeeping.
No saved cloud image, runtime configuration or credential configuration was
republished. New feature work should start from current main and run setup/checks.

### Protection settings confirmed by owner export

The owner supplied the current main-protection API response after the merge.
[Normalized evidence](evidence/phase-c/main-protection-owner-readback.json) retains
control values and principal identities, omitting redundant URLs/public profiles.
Receipt date: November 2, 2026, Pacific; command execution timestamp was not
supplied. The connector still returns HTTP 403 for this administrative read, so
the source is explicitly owner-provided rather than independently fetched.

Confirmed: all seven checks from App 15368 with `strict: true`; one approving
review; code-owner review; stale-approval dismissal; latest-push approval;
conversation resolution; administrator enforcement; force pushes and deletion
disabled; push and review-dismissal restrictions naming only Joshbomb75 with
empty team/app lists. CODEOWNERS is on the actual merged base and names that
human reviewer for every file, including itself.

A current repository read also confirms `allow_auto_merge: false`.
The response omits `bypass_pull_request_allowances`; this record does not invent
a value for it or claim exhaustive bypass certification. Required signatures and
linear history are disabled, which is permitted by the agreed M0 scope. No setting
was changed during this housekeeping. The readback, actual final-head human
approval, and successful resulting-main run satisfy the revised controls.

### Historical closeout exercises and local limits

Local setup passed; the complete check script passed both before and after restoring
the temporary exercises:
13 frontend, 10 backend and 29 Python tests at the earlier closeout snapshot.
The later startup fix adds one Python regression (30 total). The exercised source mutations are
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

## Acceptance and next actions

| Criterion | Current status                                                                                                                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1        | Satisfied: required checks/source verified live; owner export confirms required PR reviews and strict/up-to-date validation                                                                                                            |
| C2        | Satisfied for revised scope: bot-authored PR #16, actual Joshbomb75 approval and owner merge; complete credential isolation deferred                                                                                                   |
| C3        | Satisfied: checks/thresholds preserved, human-reviewed whole-repository CODEOWNERS on actual main, required code-owner review confirmed by owner export                                                                                |
| C4        | Satisfied for bounded scope: representative detection exercises and hosted aggregate failure/success recorded; current enforcement settings confirmed separately                                                                       |
| C5        | Satisfied: exact false-positive classification verified, human-reviewed and merged; both final scans pass; unchanged review deadline tracked in [issue #17](https://github.com/Johnson-Dev-Agent-Management/project-manager/issues/17) |
| C6        | Satisfied: owner approval/merge and successful resulting-main run verified; current protection readback completes the agreed closeout evidence                                                                                         |

M0 is complete for supervised feature development. The owner-approved merge and
subsequent supplied settings evidence complete the revised acceptance criteria;
this is not a claim of credential isolation, exhaustive bypass resistance or
production readiness. Start the next bounded feature from current main, with
acceptance criteria, meaningful regression tests, all required CI and owner review.

The remaining dated item is ordinary maintenance: review the existing ten scanner
fingerprints by November 9, 2026 at 4 p.m. Pacific in issue #17. This housekeeping
does not extend or change the exception. See the [handoff](milestone-0-phase-c-owner-handoff.md).
