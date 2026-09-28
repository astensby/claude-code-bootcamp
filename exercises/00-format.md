# How the exercises are written

Every exercise doc has the same shape, so you always know where to look. Read this once.

1. **An opening paragraph.** "In this exercise we will…": what we build and why. It also says what to use if you brought nothing of your own.
2. **Steps.** Four numbered lines, the same ones the instructor shows on the slide. Where a ready-made prompt helps, it sits in *italics* under the step. Paste it as written, then change it to fit.
3. **Done when.** One sentence you can check.
4. **Stretch.** Two to four things to try if you finish early.
5. **Compound.** The two-minute question we answer together after every exercise (below).
6. **Stuck?** The git command that gives you the finished state, so you can carry on with the next exercise.

Every exercise works on your own data or your own repo first. The `linkr` app, its data in `data/` and the backlog in `BACKLOG.md` are there for anyone who has nothing to bring; use them as much or as little as you like.

## The compound question

After every exercise we take two minutes together and answer one question:

> What went wrong, or what did I have to say twice?

Then we pick the cheapest thing that catches it next time, in this order:

1. **A line in CLAUDE.md**, if the agent needed to be told a fact about this repo.
2. **A test**, if a behaviour broke or was never checked.
3. **A hook**, if a check must never be skipped.
4. **A skill**, if you ran the same procedure twice.

Write it down before the block ends. The setup you leave with should be made of lines like these, each one earned by something that actually happened.

## Stuck?

Every exercise ends in a state the next one needs. If you are behind, take the finished state from the `solutions` branch instead of catching up by hand:

```
git fetch upstream --tags
git checkout <tag> -- <paths named in the exercise>
```

| Tag | Contains |
|---|---|
| `ex2-start` | E1 done |
| `ex3-start` | E2a and E2b done |
| `ex4-start` | E3 done |
| `ex5-start` | E4 done (the long form) |
| `ex5-done` | the day's exercises and the E5 demo done (issue #8 is left for the docs-drift goal) |

Take only the paths the exercise names. Checking out more replaces your own work with the solution's.
