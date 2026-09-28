# How agent work ships here

1. **Where it runs:** one issue per worker, each in its own worktree (`claude --worktree ex4-<n>`), branch named after the issue. Nothing is built on `main` directly.
2. **Before a PR:** `/check` green in the worktree, pasted into the PR body. A worker that cannot make it green says so instead of opening the PR.
3. **Who reviews:** the `reviewer` subagent (fresh context, exercises the acceptance list live), then `/code-review`, then CI, then me.
4. **What I read:** the reviewer's findings and the check table. The diff only where a finding points.
5. **What gates merge:** every acceptance line observed (not inferred), CI green, no `blocker` or `major` open. Conflicts are resolved in the worker's worktree and re-verified before merging.
6. **Merge order:** smallest blast radius first; shared files (`app/src/api/links.ts`) merged one at a time.
7. **Where lessons go:** the reviewer's top finding becomes a CLAUDE.md rule or a test in the same session, never a note for later.
8. **What stays human:** picking the issues, reading findings, merging. Workers and reviewers do everything else.
