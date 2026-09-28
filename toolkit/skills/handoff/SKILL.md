---
name: handoff
description: Write a handoff note so the next session or person can continue without you. Use at the end of a session, before a context reset, or when asked to hand over.
argument-hint: [file]
---

# Handoff

Write `HANDOFF.md` at the repo root (or `$0` if given). Overwrite; git keeps history.

## Contents, in this order

1. **Where things are** — a table: file or folder · role · state (done / draft / broken).
2. **What was done this session** — five bullets at most, each naming a file or command.
3. **What is open** — the next steps in order, each one sentence, each starting with a
   verb. Mark any that are blocked and on what.
4. **How to verify** — the commands that prove the current state (`npm test`, `/check`,
   a URL to open). Paste the last real output of the most important one.
5. **Decisions made** — one line each, with the reason. Decisions the next person would
   otherwise re-derive.
6. **Traps** — anything that cost time: a flag that moved, a quirk in the data, a test
   that is slow.

## Rules

- Written from evidence: the transcript, `git log`, `git status`, the last test run. Not
  from memory of what was intended.
- Paths and commands verbatim, so they can be pasted.
- Under 60 lines. If it is longer, the session did too many things; split the note.
- End with the one thing you would tell the next person first.
