## Reflection — 2026-09-27 — bootcamp day: E1 to E5 on linkr

**Goal:** run one loop through the day on this repo and leave with a setup that was earned: CLAUDE.md, `/check`, a hook, a skill, a reviewer, a workflow, one goal.

### Mistakes & root causes
- **A merge commit went in red.** Resolving the #2/#4 conflict in `app/test/api.test.ts` by hand dropped one `});`, and the merge was committed before `npm test` ran. Root cause: the workflow verified before PRs, not after merges. The Stop hook only guards agent turns, and a hand merge is not one.
- **The loop's agent could not run its own check.** `claude -p` in a workspace that has never been trusted ignores every `permissions.allow` entry in `.claude/settings.json`, so `npm test` and `npm run lint` were denied and the agent reasoned from pasted output instead of evidence. Root cause: I assumed print mode reads the same settings an interactive session does. It does, but only after the trust dialog.
- **The goal's bound was ambiguous.** "No test edited" stopped the agent at four warnings that lived in test files, correctly. Root cause: the bound named a file set when it meant "no assertion changes". The evaluator can only be as precise as the sentence it is given.
- **The first `/stats` cut kept a stale sentence.** The dashboard still said numbers were pre-computed by `build.mjs` after the page went live. Root cause: I checked the charts and the top-5, not the prose. Screenshots are evidence for what you look at.

### What worked
- `/check` with a seeded expired link: the 410 path, the past-expiry 400 and "no click counted" became three rows instead of a sentence, and the E2b feature failed honestly on issue #5 before anyone looked at the diff.
- The reviewer exercising the acceptance list live. `/MyLink` and `/mylink` were requested, not read about. That is the check that would have caught a worker who lowercased on create only.
- Three worktrees, one merge order, two real conflicts resolved with the diff in front of me. The conflicts were in the shared create handler and in the page helper, exactly where two issues touched the same lines.
- `/goal` with a bound of three turns: from 41 warnings to 4, every edit type-only, and it stopped at the bound instead of arguing.

### Lessons to carry forward
- Verify after every merge, not only before every PR. A merge is a change.
- Trust the workspace once, interactively, before running any `claude -p` loop in it; otherwise the allowlist is silently ignored.
- Write bounds as observable facts ("no assertion changes"), not file sets.
- The reviewer's value is the method, not the finding: it must request, run and observe. A reviewer that only reads the diff is a second author.
