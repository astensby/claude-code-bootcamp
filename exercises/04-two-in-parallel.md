# E4 · Two in parallel, one reviewer

Block 4 · 20 minutes

In this exercise we will run two Claude sessions at the same time, each building a different change in its own git worktree, and then review what they built without reading the diff. A third session reviews each PR and writes an HTML walkthrough you can read in three minutes. You read that, and either merge or send the PR back with findings.

Pick two small features for your dashboard. If you would rather have acceptance lists that are already written, take issues #2 (custom aliases) and #4 (rate limit) in the repo. Those two change the same create handler in `app/src/api/links.ts` on purpose: the second merge either conflicts, or goes through clean without anyone checking that the two features still work together. Both are worth seeing.

Prompts you can paste are in *italics*.

## Steps

1. Pick two small things: issues #2 and #4 in the repo, or two dashboard features
2. Two terminals, `claude --worktree` in each: "implement it, run the tests, open a PR"

   In each terminal, after `claude --worktree ex4-<n>`:

   *"Implement issue #<n> (or: <the feature>). Run the tests before you report done. Open a PR with gh when green. Touch nothing the task does not need."*

3. A third session: "review PR #n and write an HTML walkthrough I can read without the diff"

   *"Review PR #<n> against its acceptance list. Then write a single-file HTML walkthrough at reviews/pr-<n>.html: what changed and why, each acceptance line and how it was verified, the risky parts, your findings by severity. Code only where a reader needs it."*

   `reviews/` is gitignored: the walkthrough stays on your machine and never ends up in a PR.

4. Read the walkthrough, not the diff. Merge, or send it back

## Done when

**Two PRs are open, you have read one walkthrough, and at least one PR is merged or sent back with findings.**

## Stretch

- Use `toolkit/agents/reviewer.md` as the reviewer: copy it into `.claude/agents/`, then *"use the reviewer on PR #<n>"*. Run `/code-review <n>` alongside it, and `toolkit/skills/pr-triage/` when there are more PRs than you have time for.
- Issue #6 as a third worker: your E1 dashboard served at `/stats` with live numbers. It may use `/add-chart`.
- Write `WORKFLOW.md` in eight lines: where agent work runs, what must be true before a PR, who reviews, what you read, what gates a merge, the merge order, where lessons go, what stays human.
- Take over a worker from your phone with Remote Control.

## Compound

Two minutes, together. Take the reviewer's top finding: which `CLAUDE.md` rule or which test would have prevented it? Add it. If the reviewer missed something you caught, the fix goes into the review prompt, or into `reviewer.md` if you used it.

## Stuck?

```
git fetch upstream --tags
git checkout ex5-start -- .claude/agents WORKFLOW.md
```

The long form of this exercise, three issues whose merges collide and `WORKFLOW.md`, is [04-long-form.md](04-long-form.md).
