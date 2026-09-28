---
name: groom
description: Turn the raw backlog into a curated ready queue by presenting each item as a card with a draft spec and a recommended decision, then applying the human's decisions. Use when asked to groom, shape the backlog, or decide what is ready. User-invoked only.
disable-model-invocation: true
---

# Groom

Grooming has two halves: **prep** (drafting, automatable) and **decide** (human
judgement). This skill loads or makes the drafts, then makes deciding fast: the human
rates cards, never writes specs.

## Steps

1. **Load candidates.** GitHub: issues labelled `needs-spec` (or unlabelled and without an
   Acceptance list). File-based: `BACKLOG.md` entries without one. Items that carry a
   `<!-- groom-prep:v1 -->` block are already drafted; parse the block. For the rest, draft
   inline with the same contract as the `groom-prep` skill (title, 3–5 checkable
   acceptance lines, 1–2 questions as choices with a `[recommended]` option, a
   recommendation, a size).
2. **Re-check every loaded draft against the repo as it is now.** Drafts go stale: a
   file it names may be gone, a later PR may have shipped it, a dependency it assumes may
   have been removed. Grep before presenting. If a premise is dead, rewrite the card and
   say `premise corrected:` on it. Never let a stale draft flow into a decision.
3. **Present one table**, one row per item, most promotable first:

| # | Title | Rec | Size | Acceptance (count) | Question 1 (recommended option) | Question 2 |
|---|---|---|---|---|---|---|

   Under the table, one block per item with the full acceptance list and the options.
   For one or two items, skip the table and walk them inline.
4. **Ask for decisions, all at once**, in the form `#12 ready A`, `#14 reshape: <how>`,
   `#15 drop`, `#16 split`, `#17 defer`. Accepting the recommended option costs the human
   nothing: "all as recommended" is a valid answer.
5. **Apply.** `ready` → write the final acceptance list into the item and label it
   `ready` (GitHub: `gh issue edit`; file: mark the entry). `reshape` → rewrite the item as
   instructed, keep `needs-spec`. `drop` → close with the one-line reason. `split` → the
   children go into the item as a checklist; nothing new is created until one is
   prioritised. `defer` → leave as is.
6. **Report:** N ready, M reshaped, K dropped, one line each. Then stop.

## Hard rules

- The human decides. This skill proposes and applies; it never promotes on its own.
- `ready` means the acceptance list is good enough to build from without asking. It does
  not mean "build now"; what gets built is a separate call.
- Never start implementing during grooming, however small the item looks.
