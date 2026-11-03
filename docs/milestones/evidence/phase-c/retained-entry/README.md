# Retained entry CI reports

Source: run [40632431988](https://github.com/Johnson-Dev-Agent-Management/project-manager/actions/runs/40632431988),
head `67035dfa7f0e87a6ee5ae4601515800524ed96a7`, tested merge
`0e29546900765364a1861d5537c83d44dc7af5ef`. Retrieved 2026-11-03 UTC before expiry.
These reports validate that entry snapshot, not the later documentation commit.

The adjacent [CI readback](../ci-recheck-2026-11-03.json) retains all seven job and
source IDs, diagnostic excerpts, archive digests/expiry and inspection results.
Selected JUnit/TRX, coverage, tool versions and clean security reports are retained
here. Production provenance uses commit/run/file-count/original-manifest-digest
summaries because raw maps pairing Api filenames with hashes triggered generic-key
findings. Original maps remain in the source ZIPs; output hashes were independently
verified. Absolute runner repository paths in selected
reports are replaced with `<repository>` and retained text uses LF newlines;
archive-byte digests in the readback
refer to the original downloaded ZIPs. No raw credentials or secret findings.

Seven ZIPs were transferred and matched API SHA-256 digests. The E2E ZIP is
33,607,179 bytes and exceeds the executor transfer limit of 32 MiB. Its metadata,
API digest and decoded ten-run success log were inspected, but local ZIP-byte
inspection remains Unverified. The owner should retain the original E2E ZIP
before 2026-11-04 04:30:46 UTC. Full ZIPs are not committed to the repository.
