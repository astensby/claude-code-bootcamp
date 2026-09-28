# The loop

A loop is six steps run without you. Each step is something you did by hand during the
bootcamp; the loop does them in order and stops when it should.

| Step | Skill or agent | Who | What it leaves behind |
|---|---|---|---|
| 1 Groom | `groom` | **human** | issues marked `ready`, with an acceptance list |
| 2 Build | `claude --worktree` + a goal | agent | a branch with the change |
| 3 Verify | `check` skill, then the `reviewer` agent | agent | a PR with the evidence table and findings |
| 4 Triage | `pr-triage` | agent | a board: 🟢 merge · 🟡 second look · 🔴 human |
| 5 Reflect | `reflect` | agent | a dated entry in `REFLECTION.md` |
| 6 Prep | `groom-prep` | agent | draft specs on the raw items for the next groom |
| Merge | `gh pr merge` | **human** | main moved |

Two steps stay human on purpose: deciding what is ready (1) and merging (the last). The
loop can draft the decision and sort the queue; it does not get to decide scope or move
`main`. Everything else is mechanical enough to run at night.

## How to start one

1. Copy `loop.md` to the repo root and fill the brackets. Keep the WIP cap small until
   you trust the reviewer.
2. Make sure the five skills (`check`, `groom`, `groom-prep`, `pr-triage`, `reflect`) and
   the `reviewer` agent are under `.claude/` (copy them from `toolkit/`). `/schedule` runs
   in the cloud on a fresh clone, so commit them to the repo first; nothing under
   `~/.claude/` reaches a scheduled run.
3. Run it by hand once, step by step, in one session: read `loop.md`, then "run one
   iteration of loop.md". Watch each step. Fix the playbook where it went wrong.
4. Then unattended, inside a session: `/loop Read loop.md and run one iteration` (it paces
   itself; `/loop 30m …` runs it on a clock), or `/schedule` the same instruction nightly.

## What makes it safe

- The cap: it stops stacking PRs when nobody is merging.
- The gates: nothing opens a PR without the check table and a reviewer pass.
- The bound in every goal: turns, files, what it must not do.
- The rule that it never merges. Anything it did wrong is a branch you delete.

## What makes it useful

- `groom-prep` at the end of each run means your next grooming session is rating cards,
  not writing specs.
- `reflect` at the end of each run means the playbook gets better on its own evidence,
  not on your memory of what went wrong.
