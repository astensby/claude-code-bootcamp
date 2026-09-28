# E5 · A goal that runs without you

Block 4 · 10-minute demo · take-home by Friday

In this exercise we will hand Claude a goal instead of a task: an end state, a command that checks it, and a bound that stops it. `/goal` then runs until the check passes or the bound is hit, and an evaluator judges every turn. After that we put the same loop into a file the repo keeps, `loop.md`, and finish with `/reflect`, which writes what was learned into `REFLECTION.md` so one lesson can go into `CLAUDE.md`.

It comes in two parts. Part A is a demo: the instructor runs it on this repo while you watch, using issue #7 (lint debt) and the ready-made goal in `toolkit/goals/lint-debt.md`. Part B is yours: the same four steps in a repo of your own, by Friday.

## Part A · The demo (10 min, instructor)

1. One goal, three lines: end state, check, bound

   `toolkit/goals/TEMPLATE.md` filled in as `goals/<name>.md`; `toolkit/goals/lint-debt.md` is the example. The check is a command whose exit code decides, never something an evaluator can have an opinion about.

2. `/goal` with the three lines inline. Watch the evaluator's verdict each turn

   `/goal <end state>. Check: <check>. <bound, for example "or stop after 8 turns">`. `Ctrl+O` shows the evaluator's reason; `/goal clear` stops it. `/goal` only runs in a trusted workspace, so the folder must be trusted in Claude Code first.

3. `loop.md` in the repo root, then `/loop` "read loop.md and run one iteration"

   `cp toolkit/loop/loop.md loop.md` and fill in the brackets: the WIP cap, the gates, where goals live. Label one issue `ready` first; the loop only builds `ready` items. It picks the oldest, builds, verifies, and stops. It never merges.

4. `/reflect` writes `REFLECTION.md`. One lesson goes into `CLAUDE.md`

   Copy `toolkit/skills/reflect/` into `.claude/skills/` first.

## Part B · The take-home: one loop by Friday, in a repo of your own

1. Copy `check`, the reviewer and `loop.md` from the toolkit into a repo of yours. Adapt the two `ADAPT:` lines in `check`, and fill in the brackets in `loop.md`.
2. Write one goal: end state, check, bound. `toolkit/goals/TEMPLATE.md` is the shape.
3. Run `/goal` with it. Stop at the bound.
4. Run `/reflect`, then put one lesson into `CLAUDE.md`.

## Done when

**The goal ran at least one evaluated turn in your own repo, and `REFLECTION.md` exists there.**

## Stretch

- `/schedule` the loop nightly: the same `loop.md`, on a cron instead of in your terminal.
- Read `toolkit/loop/README.md`: the six-step cadence (groom, build, verify, triage, reflect, prep) and the two steps that stay human, deciding what is ready and merging.
- `/loop 30m Read loop.md and run one iteration` runs it on a clock instead of self-paced.

## Compound

The last one, and the one to keep: the day's lessons go into `CLAUDE.md`.

## Stuck?

```
git fetch upstream --tags
git checkout ex5-done -- goals loop.md REFLECTION.md CLAUDE.md
```

That is the finished state of the demo on this repo.
