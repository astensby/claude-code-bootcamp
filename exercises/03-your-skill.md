# E3 · Build your own skill

Block 3 · 15 minutes

In this exercise we will write a skill: a procedure Claude follows whenever you run `/its-name`. You will run it twice. The first run shows what the skill got wrong; then you fix the skill, not the prompt, and run it again. That second run is the point: a skill you corrected once keeps working the next hundred times.

Pick a task you repeat at work. If nothing comes to mind, add a chart to your E1 dashboard. `toolkit/ideas/personal-skill-ideas.md` has twenty one-line ideas, and `toolkit/skills/add-chart/` is a finished version of the chart skill for when you are stuck. Before this exercise the instructor demos two other things from the toolkit, `/check` and the Stop hook; both are stretches below.

Prompts you can paste are in *italics*.

## Steps

1. Think of a task you do repeatedly. Fallback: add a chart to your dashboard
2. `/skill-creator`, or write `SKILL.md` by hand: task, input, desired output

   *"Create a skill <name>. Given <input>, it <does the task> and finishes by <how it shows the result>. Description: when to use it, one sentence."*

   `/skill-creator` is a plugin skill; if you do not have it, write the file by hand from the prompt above.

3. Run it: `/your-skill`
4. What did it get wrong? Fix the skill, not the prompt. Run it again

## Done when

**The skill has run twice and the second run needed no correction from you.**

## Stretch

- Make the skill prove its result: a test, a request against the running app, the page opened in a browser.
- Copy `toolkit/skills/check/` into `.claude/skills/`, change the two `ADAPT:` lines, and run `/check` on the E2b feature. Expect one FAIL: an invalid URL that returns 201 (issue #5). Fix issue #5 so `/check` is green before E4. Claude Code's built-in `/verify` is a different tool: it drives the app and writes what worked into a skill of its own; `/check` prints the table the reviewer and the loop gate on.
- Add a hook: *"Add a Stop hook to .claude/settings.json that runs npm test and blocks with 'tests red, not done' when it fails. Use toolkit/hooks/stop-run-tests.json as the reference."* Then break a test on purpose, ask Claude to finish, and watch it refuse. A hook is the shape for a check nobody may skip; `toolkit/hooks/` has three.
- If your CLI has `/skill-doctor`, run it on your skill and act on one finding.

## Compound

Two minutes, together. Which check do you re-run by hand at work before you trust a change? Write only its `description:` line into `.claude/skills/<name>/SKILL.md`.

## Stuck?

```
git fetch upstream --tags
git checkout ex4-start -- .claude/skills app .claude/settings.json
```

That brings `check`, `add-chart`, the fix for issue #5 and the Stop hook.
