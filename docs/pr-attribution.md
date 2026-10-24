# Pull request attribution

Use the PR template for both human and AI implementations. Attribution describes
who primarily implemented the changes, independently of the GitHub account that
opens the PR. Authentication and PR ownership stay unchanged.

For AI implementations, include these standalone lines (name the actual agent):

```text
Implementation type: AI
Implementation author: Codex Cloud
```

For manual implementations, use `Implementation type: Human` and
`Implementation author: Human`. Keep exactly one type field, outside quotes or
code blocks. An untouched template, missing field, or duplicate type fields will
not trigger labeling. Attribution is self-declared, not proof of authorship.

Agents should apply `AI-authored` directly if their tools allow it. As a fallback,
the **Pull request attribution** workflow adds it on PR creation, edits, and
reopening, including drafts and forks. It reads the current PR body and accepts
only the standalone `Implementation type: AI` field; it never uses the opener's
account as an authorship signal. It creates a missing label and maintains the
description "Changes primarily implemented by an AI coding agent."

The workflow only adds the attribution label and preserves other labels. If an
incorrect AI attribution is corrected to Human, manually remove `AI-authored`.

## Setup and verification

1. Merge the attribution PR into the default branch. The `pull_request_target`
   workflow runs trusted base-branch code, so the new workflow cannot validate
   itself on the PR that introduces it.
2. GitHub Actions must be enabled and permit this workflow's `pull-requests: write`
   token permission. No PAT, secret, third-party action, or dependency is needed.
   Do not change repository-wide security policies if automation is restricted;
   use manual labeling instead and report the restriction.
3. Open or edit an AI-attributed PR, then inspect the workflow run and confirm
   the `AI-authored` label and its description. Editing the body also processes
   an existing PR; existing PRs are not scanned automatically.
4. Confirm a Human-attributed PR stays unlabeled. An unsuccessful workflow run is
   not proof that the label was applied; report failures and use a maintainer if needed.

If the label must be provisioned manually, a maintainer can run:

```bash
gh label create AI-authored --color 7057ff \
  --description "Changes primarily implemented by an AI coding agent." --force
gh pr edit <pr-number> --add-label AI-authored
```

Only apply the second command to a verified AI-authored PR. The workflow grants
only `pull-requests: write`; all other token permissions are disabled. It reads
metadata through GitHub's API, does not check out code, and never evaluates PR
text as a command. Keep these boundaries when maintaining it.

## Local validation

Run `python3 -B -m unittest discover -s tests -p 'test_pr_attribution.py' -v`.
These standard-library tests execute the actual workflow script with a mocked
GitHub API, covering attribution parsing, label maintenance, permission failures,
and untrusted PR text. They do not prove that repository Actions permissions or
live labeling work; verify those after merge using the steps above.
