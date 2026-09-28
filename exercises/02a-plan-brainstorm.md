# E2a · Plan and brainstorm

Block 2 · 15 minutes

In this exercise we will turn an idea into a spec before any code is written. Claude interviews you about the feature, shows you three ways to build it as a page you can click through, and writes `SPEC.md` from what you agreed. Step 3 is the one to pay attention to: a page you can open and click is a much better surface for giving feedback than a wall of text, and you will use the same move to review a PR in E4.

Pick a feature your E1 dashboard does not have yet. If you would rather work in the app, take issue #1 (links can expire): it has an open question the interview should find. Run `scripts/seed-issues.sh` first if the issues are not in your repo yet.

Prompts you can paste are in *italics*.

## Steps

1. Pick a feature for your dashboard, or issue #1 in the repo
2. "Interview me about it, one question at a time"

   *"Interview me about <the feature | issue #1>, one question at a time, and propose an answer for each question where you can. Stop when you could write a spec."*

   `/grill-me` from mattpocock/skills does the same if you have it installed.

3. "Show me three ways to build it, as one HTML page I can click through." Open it, pick one, say why

   *"Show me three ways to build this, as one HTML page at options.html I can click through: a sketch of each, what it costs, what it cannot do. No code yet."*

4. "Write SPEC.md from what we agreed"

   *"Write SPEC.md from what we agreed: the behaviour, then acceptance criteria I can check one by one."*

## Done when

**`SPEC.md` exists with acceptance lines you can check, and you looked at `options.html` before choosing.**

## Stretch

- Use plan mode (`Shift+Tab`) for the interview: Claude can read and ask, but not write.
- *"Plan the implementation of SPEC.md as numbered steps with the files you will touch and how you will check each. Write it to PLAN.md. No code yet."*
- If you took issue #1: the open question is what happens to the stats of an expired link. Did the interview reach it, or did you have to bring it up?

## Compound

Two minutes, together. What did the interview surface that you had not thought of? Would you have found it without being asked?

## Stuck?

```
git fetch upstream --tags
git checkout ex3-start -- SPEC.md
```

That `SPEC.md` is for issue #1.
