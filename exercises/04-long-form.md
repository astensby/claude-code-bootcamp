# E4 · Long form · Three issues in parallel, reviewed, merged

Block 4 · 45 minutes. The longer version of E4, for after the day or for a group that finished the short form early.

In this exercise we will run three workers in parallel on issues #2 (custom aliases), #4 (rate limit) and #6 (your E1 dashboard served at `/stats` with live numbers), review each with a fresh-context reviewer agent and an HTML walkthrough, resolve the merges the issues make collide on purpose, and write down the workflow you just ran as `WORKFLOW.md`. The reviewer is the point: it has to earn its findings by exercising every acceptance line, and you check whether it did.

Prompts you can paste are in *italics*.

## Steps

1. Set up the reviewer. Create `.claude/agents/reviewer.md` from `toolkit/agents/reviewer.md`: `tools:` listed explicitly, read-only by instruction, runs the check script, exercises the acceptance list literally, returns findings by severity with file:line, never edits, ends with a merge recommendation. If E3 did not do it, copy `toolkit/skills/check/` into `.claude/skills/`, adapt the two `ADAPT:` lines, and fix issue #5 first if `/check` is red.
2. Pick the issues. Issues #2, #4 and #6, or #3 instead of #6 if you built E1 on one of the alternative datasets. Read the acceptance lists.
3. Start three workers. **Option A, recommended the first time:** three terminal tabs, each `claude --worktree ex4-<n>`, with

   *"Implement issue #<n>. Run /check before you report done. Open a PR with gh when green."*

   **Option B:** one session:

   *"Dispatch three background subagents with isolation: worktree, one per issue #2, #4, #6, same instructions: implement the issue, run /check before reporting done, open a PR with gh when green."*

   Put at least one worker on a cheaper model or a lower effort level and see if you can tell the difference. Tell the #6 worker it may use `/add-chart`.

4. Review each PR as it appears. CI runs on its own. In your main session: *"use the reviewer on PR #<n>"*, then `/code-review <n>`. Then ask for a walkthrough:

   *"Write a single-file HTML walkthrough of PR #<n> at reviews/pr-<n>.html: what changed and why, each acceptance line and how it was verified, the risky parts, the reviewer's findings. Show code only where a reader needs it."*

   Open it (`reviews/` is gitignored, so the walkthrough stays on your machine). You review from the walkthrough and the findings, not the diff (`toolkit/skills/pr-walkthrough/` does this as a skill). Send the worker back with the findings if needed. Did the reviewer catch that `/MyLink` and `/mylink` must resolve to the same target? If not, check it yourself, and note what the reviewer needs to be told.

5. Merge, in the order you choose. #2 and #4 both change the create handler in `app/src/api/links.ts` and usually add tests at the same spot in `app/test/api.test.ts`; #6 may collide with #4 in `app/src/server.ts`. Resolve each conflict with the agent in that worktree. A merge that goes through without conflicts is not proof the two features work together: re-run `/check` and exercise both acceptance lists on the merged branch, then merge.
6. Write `WORKFLOW.md`, eight lines: where agent work runs (worktree, branch naming), what must be true before a PR (`/check` green), who reviews (reviewer, `/code-review`, CI, you), what you read (the findings and the check table; the diff only where a finding points), what gates a merge, the merge order (smallest blast radius first, shared files one at a time), where lessons go, what stays human (picking the issues, reading findings, merging).

## Done when

**At least two PRs are merged with the reviewer's findings addressed, `WORKFLOW.md` exists, and `/stats` shows your dashboard.**

## Stretch

- Take over the third worker from your phone with Remote Control.
- Copy `toolkit/skills/pr-triage/` into `.claude/skills/` and run `/pr-triage`: a one-page board of open PRs, safe to merge / needs a human / do not merge, with reasons.

## Compound

Two minutes, together. Take the reviewer's top finding: which `CLAUDE.md` rule or which test would have prevented it? Add it. If the reviewer missed something you caught, the fix goes into `reviewer.md`.

## Stuck?

```
git fetch upstream --tags
git checkout ex5-start -- .claude/agents WORKFLOW.md
```
