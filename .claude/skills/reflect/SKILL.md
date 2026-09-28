---
name: reflect
description: Learn from the session that just happened and append a dated entry to REFLECTION.md. Use at the end of a build or debugging session, when the user runs /reflect, or when asked what went wrong.
---

# Reflect

A session is worth what you carry out of it. Write down what actually happened, not
advice that could have been written before the session started.

## Steps

1. **Reconstruct from evidence.** Look back over the conversation and the work: the goal
   (did it change?), wrong turns (false assumptions, abandoned approaches, failed
   commands), every correction the user gave (the highest-signal moments), and what
   worked. If the session went cleanly, say so in two lines; do not invent problems.
2. **Find root causes, not symptoms.** "Tests failed" is a symptom; "I said done without
   running them" is the cause. "The flag was wrong" is a symptom; "I trusted memory
   instead of `--help`" is the cause. Lessons attached to causes transfer; lessons
   attached to symptoms do not.
3. **Write lessons a future session can act on.** Each names the trigger, the action, and
   the moment it came from. Weak: "be more careful". Strong: "before naming a CLI flag,
   run `--help`; I documented `--port` and it does not exist."
4. **Append to `REFLECTION.md`** in the repo root. Append, never overwrite; the running
   log is the point. Create the file if missing. Use today's date from context.

```markdown
## Reflection — YYYY-MM-DD — <short session label>

**Goal:** <one line>

### Mistakes and root causes
- **<what went wrong>** — <root cause, and the moment it showed>

### What worked
- <the call that paid off, and why>

### Lessons to carry forward
- <trigger → action, tied to a cause above>
```

Few bullets per section. "Nothing notable" beats padding.

5. **Point at where a lesson belongs.** If a lesson is a rule for this repo, propose the
   CLAUDE.md line (or a `.claude/rules/` file if it applies to one folder). If it is a
   check, propose the test or hook. If it is how a skill should behave, propose the edit
   to that skill. Propose; do not apply without being asked.

Show the entry, say where it landed, keep the spoken summary to three lines.
