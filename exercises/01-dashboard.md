# E1 · Data to interactive dashboard

Block 1 · 15 minutes

In this exercise we will take a dataset, find out what is in it, and build a single-file interactive HTML dashboard from it. It is the first thing you build today, and the rest of the day builds on it: you plan a feature for it in E2a, write a skill for it in E3, and review changes to it in E4.

Use your own data if you have some: a CSV, a JSON file, an export from a system you know. If not, use the repo's `data/`, which is the click export of the `linkr` app, or `data/alt/` if you would rather work on public data (private cars by fuel type from Statistics Norway, or Norwegian employers with 50 or more staff). If you keep the linkr data, you can serve your dashboard from the app later (issue #6, an E4 stretch).

Prompts you can paste are in *italics*.

## Steps

1. *Analyse `@data/`, or a file of your own, and explain what is in it*
2. *Show me the most interesting findings*
3. Build an interactive HTML dashboard from it

   *"Build a single-file interactive HTML dashboard at dashboard/index.html from @data/ that answers: which links get the most clicks, how traffic moves over the week, which referrers matter. List your assumptions at the end."*

4. *Open it. How can we make it better?*

## Done when

**The dashboard opens in a browser and one change you asked for is in.**

## Stretch

- Ask it to open the page itself (with the Chrome extension or the desktop app's browser) and fix what it sees.
- Ask *"what did you assume about the data?"* and check the answer against `data/clicks.csv`.
- Copy `toolkit/skills/dataset-profile/` into `.claude/skills/` and run `/dataset-profile data/`.

## Compound

Two minutes, together. What did you only notice once the page was open in a browser? Nobody checked it before you did; block 3 is where that changes.

## Stuck?

```
git fetch upstream --tags
git checkout ex2-start -- dashboard
```
