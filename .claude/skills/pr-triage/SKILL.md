---
name: pr-triage
description: Sort the open PRs by blast radius into three tiers (safe to merge, needs more eyes, human required) with a reason each, so human attention goes only where being wrong is costly. Use before a merge session, as a loop step, or when asked what is safe to merge. Never merges.
---

# PR triage

Do not review every PR to the same depth. Score each open PR by how costly being wrong
would be and how hard it is to undo, route it to a tier, and hand the human a board.

## Steps

1. **List the queue:** `gh pr list --state open --json number,title,headRefName,additions,deletions,changedFiles,statusCheckRollup,reviewDecision,body`.
2. **Score each PR's blast radius:**
   - **Sensitive surface** — migrations or schema, auth, payments, a public contract, CI
     workflows, secrets, anything that deletes data: at least 🟡, usually 🔴.
   - **Reversibility** — a revert of the merge restores the world: lower. Data changed,
     something published, a release cut: 🔴.
   - **Coverage** — the changed lines are exercised by green tests: lower. Core logic
     without a test: raise.
   - **Size and spread** — small and in one place: lower. Many files across modules: raise.
   - **Gates** — red CI, or a reviewer finding not yet addressed: 🔴 regardless.
3. **Tier:**

| Tier | Means | What the human does |
|---|---|---|
| 🟢 safe to merge | green gates, low blast radius, review clean | reads the one-line summary, merges |
| 🟡 needs more eyes | moderate blast radius, nothing alarming | gets a second opinion first (below), then a light confirm |
| 🔴 human required | high blast radius or any red gate or open finding | reads the focused checklist before deciding |

   For each 🟡, run one more independent look with a fresh context: dispatch the
   `reviewer` subagent (if `.claude/agents/reviewer.md` exists) on that PR, or run
   `/code-review` on it. A finding promotes the PR to 🔴 with the finding attached; a
   clean result keeps it 🟡 with "second look clean".
4. **Print the board**, 🔴 first, then 🟡, then 🟢:

| Tier | PR | Title | Why this tier | Look at | Recommendation |
|---|---|---|---|---|---|

   "Look at" names the exact files or lines worth the human's eyes; empty for 🟢.
   Recommendation is `merge`, `merge after fixes: <what>`, or `hold: <why>`.
   When run from `loop.md`, also write the board to `.tmp/pr-triage.md` (create `.tmp/`
   if needed) so the human can read it after the session.
5. Stop. The human merges.

## Hard rules

- **Never merge, never push, never close.** Route and recommend.
- A 🟢 still needs green gates; fast-track means less human depth, never no check.
- When unsure of a tier, round up. Over-flagging one PR is cheap.
- Say what was not checked (no browser run, no load test) rather than implying coverage.
