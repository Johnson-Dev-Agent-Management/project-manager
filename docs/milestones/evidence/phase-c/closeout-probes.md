# Bounded closeout regression exercises

Executed in the private cloud checkout based on PR #15 commit
`c1da6702a9304560997b5a93269628f76e4c5c73`, with only closeout documentation and
scanner-fingerprint changes in progress. Application/test/workflow code is
unchanged from that commit after each temporary exercise. Pinned Node 26.13.0,
npm 12.2.1 and .NET SDK 10.0.402 are selected by `scripts/common.sh`.

## Failed assertion — Passed detection

Temporarily replace the first `Could not load projects.` expected message in
`src/web/src/loading.test.ts` with `Deliberately incorrect closeout expectation.`.
From `src/web`, run `node_modules/.bin/vitest run src/loading.test.ts`.
Exit **1**: one assertion fails because the rendered alert still says
`Could not load projects.`; the four other cases pass. Restore the original file
byte-for-byte. No defective test is published.

An initial invocation from the repository root did not load the web Vitest config
and failed with `document is not defined`; that attempt was discarded, not counted
as regression detection. The command above uses the actual configured test suite.

## Blank-name validation regression — Passed detection

Temporarily change the API's `string.IsNullOrWhiteSpace(input.Name)` guard to
`input.Name is null`. The mutation still compiles but admits blank/whitespace names.
Run:

```bash
dotnet test tests/ProjectManager.Api.Tests --no-restore --filter FullyQualifiedName~RejectsBlankNamesWithoutWriting
```

Exit **1**: three existing cases fail with `Expected: BadRequest`,
`Actual: Created`; the null case passes. This is behavioral rejection, not a
compiler/network failure. Restore `Program.cs` byte-for-byte and rebuild/retest
before final validation. No defective application change is published.

## Coverage/report integrity and aggregate outcomes — Passed detection

Run the existing suite, without changing thresholds, reports or its assertions:

```bash
python3 -B -m unittest discover -s tests -p test_ci_reports.py -v
```

Exit **0**, **5 tests passed**. The suite checks independent line/branch floors
without rounding, frontend inventory and coverage, backend report/suite/coverage
integrity, missing/empty/failed/skipped reports, and the workflow's actual embedded
quality-gate code. Each of its six dependencies is tried as failed, cancelled,
skipped and missing: **24 negative combinations**, plus the all-success control.

The hosted [PR #15 run 41567726668](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/41567726668)
also records a real supply-chain failure and aggregate failure on head
`c1da6702a9304560997b5a93269628f76e4c5c73`. Its Windows/frontend/backend/policy/E2E
jobs pass. This is historical gate-propagation evidence, not final-head green CI.

## Limits and recovery

Both temporary source files were restored and verified identical to their original
bytes. Full final `scripts/check.sh` is rerun after restoration. Local exercises
prove detection; they do not prove GitHub's merge decision. Current required-check
configuration and owner review/up-to-date settings supply separate enforcement
evidence. Draft status and unrelated failures are not counted as enforcement proof.
No protected target, push/deletion/bypass probe, or defective merge was performed.
