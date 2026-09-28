---
name: pr-walkthrough
description: Write a single-file HTML walkthrough of a PR or branch so a reviewer understands the change without reading the diff. Use when asked to "walk me through PR #n", "explain this change", or before a review.
arguments: [pr]
argument-hint: <PR number or branch>
allowed-tools: Bash(gh pr view *), Bash(gh pr diff *), Bash(git diff *), Bash(git log *), Read, Write
---

# PR walkthrough: $pr

A review you can read in three minutes, from the change's point of view, with the evidence next to each claim.

1. **Gather.** `gh pr view $pr --json title,body,files,headRefName` and `gh pr diff $pr` (for a branch: `git diff main...$pr`). The issue's acceptance list. The check table in the PR body. Reviewer findings and `/code-review` output if they exist.
2. **Write `reviews/pr-$pr.html`**, one self-contained file, no external resources, a small style block. Sections, in this order:
   - header: title, issue, branch, files touched, tests added or changed
   - *What changed and why*: five lines, plain words
   - *Acceptance*: every line of the issue's list as a checklist row: the line, how it was verified (the evidence), pass / fail / not verified
   - *Where to look*: the two to four hunks a reviewer must see, with the code inline and one sentence each on why it matters
   - *Risks*: behaviour outside the issue, config, dependencies, anything a rollback would not undo
   - *Findings*: from the reviewer agent or `/code-review`, by severity, with file:line
   - *Verdict*: merge · merge after fixes · do not merge, with the reason
3. **Open it** with a browser tool if one is available; otherwise print the path. Then say in one line what the reader should check first.

Rules: code only where the reader needs it. Never invent evidence: an acceptance line nobody verified says *not verified*. The walkthrough does not replace the reviewer; it is how a human reads the reviewer.
