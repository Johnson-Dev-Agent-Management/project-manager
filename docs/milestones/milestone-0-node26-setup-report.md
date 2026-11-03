# Node 26/npm 12 setup follow-up

Status: **Implementation prepared; exact-head hosted validation is recorded in PR #15.**
Implementation type: AI
Implementation author: Codex Cloud

The owner requested modern Node/npm and passing setup after observing PR #15's
supply-chain failure. This follow-up starts at
`7a76aeeaa3bc4e31c5e8e0e2ee1fa250f830887c`. Publication uses the verified
codexcodemachine connector; no owner write, Git identity claim, protected-ref
mutation, permission change, review, merge or Phase C target probe is performed.

## Runtime and setup changes

- Pin stable **Node 26.13.0 LTS (Lithium)** and **npm 12.2.1**, verified from the
  npm registry and the installed runtime's release metadata. Avoid the registry's
  prerelease Node latest tag. Keep .NET SDK 10.0.402.
- Update the frontend engine contract and lockfile metadata, agent instructions
  and current setup documentation. Historical acceptance snapshots stay dated.
- Bootstrap private versioned Node/npm tools on every supported Bash platform,
  including Windows Git Bash, when host tools differ. A newer host can run setup;
  the project entry points select the tested pins. Versioned directories permit
  Windows upgrades without replacing an executing node.exe.
- Normalize native Windows override/cache paths. Retain native .NET prerequisites,
  locked restores, cache behavior and SQLite path conversion.
- Remove the CI global npm installation. Record the selected project tools and
  propagate their native paths to subsequent Actions steps.
- Exercise a fresh native Windows workspace bootstrap, then repeat setup and
  build. Three new Python regressions cover newer-host bootstrap/reuse in Linux
  and Git Bash control flow, forced installation, and fail-closed installation.

These are explicit protected toolchain/setup/CI-policy changes for independent
human review. Application behavior/assertions, test discovery/integrity, coverage
scope, independent 80% line/70% branch floors, security rules and scanners, browser
retries and aggregate explicit-success behavior are retained.

## Supply-chain diagnosis and inactive proposal

Fresh inspection of the latest starting-head supply-chain log confirms ten
generic-api-key findings from artifact file hashes in immutable commit
`f21a64a6d4d858afd6fb825bc99523414a82adf0`. The retained archive digests, original
manifest and independently hashed downloaded output establish non-secret
provenance. No secret values are inspected. The current tree already uses
provenance summaries, but full-history scanning still reaches the old commit.

The [exact fingerprint proposal](evidence/phase-c/proposed-gitleaks-false-positives.txt)
is **inactive**. It is not a .gitleaksignore file, is not passed to Gitleaks, and
does not change any rule, path, source, history scope or failure behavior.

| Required proposal field                        | Value                                                                                                                                                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rule and scope                                 | generic-api-key; exactly the ten commit/path/line fingerprints in the linked file; five values duplicated across two evidence files                                                                                                                    |
| Rationale                                      | Independently verified SHA-256 artifact hashes, not credentials                                                                                                                                                                                        |
| Risk                                           | Incorrect classification could hide a finding only at those immutable locations; it must be independently checked against retained artifact provenance                                                                                                 |
| Independent human reviewer / accountable owner | Joshbomb75                                                                                                                                                                                                                                             |
| Approval evidence                              | **Pending; no operative suppression**                                                                                                                                                                                                                  |
| Proposed expiry                                | 2026-11-10 UTC; removal or explicit reviewed renewal required before acceptance after expiry                                                                                                                                                           |
| Removal/retest                                 | Remove if reviewed ref disposition makes the original commit unreachable; otherwise recheck provenance/classification at expiry. After authorized activation, rerun full history and working-tree scans and all seven jobs at the exact resulting head |

[Engineering standards](../engineering.md#security-exceptions-and-definition-of-done)
requires: “Until approved it is a blocking proposal, never an operative
suppression.” No history rewrite, shared-ref cleanup or active scanner exception
is introduced. Supply-chain and the aggregate gate may continue to fail on these
historical findings until the owner approves a precise resolution.

Fresh npm data also reports **14 moderate, zero high/critical** findings rooted in
minimatch **GHSA-g3hv-75wg-m249** (<11.0.1), potential denial of service via crafted
globparts. The affected paths are development lint/parser tooling. Current
upstream ESLint/config-array still requires minimatch 10; the accessibility plugin
requires minimatch 3. No compatible fixed release in those major lines was found.
Do not downgrade supported lint tooling or force an incompatible major override.
Upstream remediation/reachability and any risk decision remain for Joshbomb75's
independent review; no vulnerability exception is granted. These moderate
advisories are reported but were not the cause of the scanner's exit 1.

## Validation and remaining Phase C scope

**Passed locally:** bash scripts/setup.sh, repeated bash scripts/setup.sh, complete
bash scripts/check.sh (13 frontend, 10 backend, 29 Python tests; no failures/skips,
backend zero warnings/errors), the three focused setup regressions, repository
Prettier, Bash syntax, diff whitespace, links and policy-preservation checks.
Node 26.13.0 reports LTS Lithium; npm is 12.2.1 and SDK is 10.0.402. Coverage
remains frontend 31/32 lines and 24/24 branches, backend 18/18 lines and 3/4
branches. Local standalone policy/scanner tools remain unavailable under the
documented release-download restriction; hosted lanes are inspected instead.

Final head/tested merge, all seven hosted job/source IDs, native Windows
setup/bootstrap logs and relevant artifacts are recorded in PR #15 after
inspection. Native Windows execution is claimed only after inspecting that job.

This follow-up does not establish enforcement. C1 remains Unverified; C2 is Failed
for this owner-accessible context; C3 is Failed because actual main lacks CODEOWNERS;
C4 and every target probe remain Unverified; C5 procedures are documented; C6
owner acceptance/post-merge validation remains Unverified. #15 remains open/draft
pending the existing isolation/replacement/bootstrap requirements. Owner merge
recommendation: **hold**. Phase C/M0: **incomplete**.
