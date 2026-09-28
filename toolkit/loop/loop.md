# loop.md — how agent work runs in this repo

Template. Copy to the repo root, fill the [brackets], delete what does not apply. This is
the playbook an unattended session reads first; the six steps below are one iteration.

## Ground rules

- **WIP cap: [3] open loop PRs.** Before starting a new issue, count open PRs on
  `loop/*` branches (`gh pr list --state open --json headRefName`). At the cap, stop and
  say so; the human clears the queue, the loop does not.
- **Gates before a PR:** `npm test` green, `npm run lint` no errors, `/check` table
  pasted in the PR body, every acceptance line observed (not inferred).
- **Evidence rules:** every claim of done has a command and its exit code, a status code,
  or a test name next to it. "Looks good" is not evidence. A row without evidence is a
  FAIL row.
- **Work by authoring goals.** Every unit of work, the iteration and every subagent it
  dispatches, gets three lines first: **End state** (observable), **Check** (a command or
  the `/check` table), **Bound** (turns, files, what it must not do). Then work against
  it. A loose instruction with no check is how an iteration drifts.
- **Parallelise around the edit, not the edit.** Read-only mapping and review fan out;
  one coherent change stays single-threaded in one worktree.
- **Never:** merge, push to `main`, close issues, change `biome.json` rules, edit a test to
  make it pass, or touch files outside the issue's scope.

## One iteration, six steps

1. **Groom** *(human)* — the ready queue exists because someone ran `/groom` and said
   which items are `ready`. The loop only builds `ready` items. If the queue is empty,
   say so in one line and skip to step 6.
2. **Build** — pick the oldest `ready` issue. Author the goal (three lines). Work in a
   worktree (`claude --worktree loop-<n>` or `isolation: worktree`), branch
   `loop/<n>-<slug>`. Implement the acceptance list, nothing beyond it.
3. **Verify** — run `/check`; add the coverage row; fix every FAIL. Then a fresh-context
   check that is not you: the `reviewer` subagent on the diff. Fix what it finds. Open the
   PR with `Closes #<n>`, the check table, and the reviewer's remaining notes.
4. **Triage the queue** — run `pr-triage` over all open PRs; run from here it also writes
   the board to `.tmp/pr-triage.md`. Red CI on an existing loop PR: fix it before starting
   anything new.
5. **Reflect** — run `reflect`; append to `REFLECTION.md`. If a lesson is a rule, propose
   the CLAUDE.md line in the PR body; do not add it silently.
6. **Prep the next grooming** — run `groom-prep` on any new or bare `needs-spec` items so
   the human's next `/groom` is pure deciding. Drafts only.

Then stop. Steps 1 (deciding what is ready) and the merge itself stay human.

## Repo specifics

- Commands: `npm test` · `npm run lint` · `npm run dev` (PORT env) · `/check`
- Issue labels: [`needs-spec` → `ready` → `loop-review` (PR open)] · [others]. In this
  repo `scripts/seed-issues.sh` creates those three.
- Branch prefix: `loop/` · Worktrees: [`.worktrees/` or the CLI default]
- Out of scope for the loop: [data/, dashboard/, anything under toolkit/]
