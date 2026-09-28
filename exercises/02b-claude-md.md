# E2b · CLAUDE.md

Block 2 · 10 minutes

In this exercise we will write a `CLAUDE.md` and then cut it down to the lines that earn their place, while Claude builds the feature you specified in E2a in a second terminal. `CLAUDE.md` is read at the start of every session, so every line in it costs context every time. Facts about the project go in the repo's `CLAUDE.md`; how you like to work goes in `~/.claude/CLAUDE.md`, which follows you between repos.

Use your own repo if you brought one without a `CLAUDE.md`. Otherwise use this repo, which has none on purpose.

Prompts you can paste are in *italics*.

## Steps

1. `/init`
2. Delete every line the repo would tell it anyway

   *"For each line in CLAUDE.md, delete it if the repo itself would tell you the same thing (package.json, README, folder names, tests). Keep it under 30 lines."*

3. "Interview me about how I like to work." Project facts go in `CLAUDE.md`, your habits in `~/.claude/CLAUDE.md`

   *"Interview me about how I like to work, five questions at most. Put what is true of this repo into CLAUDE.md and what is true of me into ~/.claude/CLAUDE.md."*

4. Let it build `SPEC.md` while you prune. Does it follow the file? (start it in a second terminal; it runs while you finish)

   *"Implement SPEC.md. Plan first, then build. Run npm test before you report done."*

## Done when

**`CLAUDE.md` is under 30 lines and contains at least one line that came from something that actually happened, and the feature works (`npm test` is green, or the page shows it).**

## Stretch

- Run `/compact` in the middle of the build and carry on.
- Add `.claude/rules/api.md` scoped to `app/src/api/` with one rule that only applies there.
- Run `/memory` and see what auto memory has already kept from this session.

## Compound

Two minutes, together. The thing you had to say twice: does it belong in `CLAUDE.md`, or in a rules file because it only applies to one folder?

## Stuck?

```
git fetch upstream --tags
git checkout ex3-start -- SPEC.md CLAUDE.md app
```
