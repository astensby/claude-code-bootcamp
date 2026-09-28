---
name: groom-prep
description: Draft the spec for under-specified backlog items (title, checkable acceptance list, open questions, recommendation) so a later /groom session is pure deciding. Use when asked to prep the backlog, as a loop wind-down step, or on a schedule. Drafts only; never decides.
---

# Groom-prep

The automatable half of grooming. It does the homework on raw items so the human rates
instead of authors. **It enriches; it never decides.** No promotion, no closing, no
questions to the human; it writes a draft into each item and stops.

## Steps

1. **Find bare items.** GitHub: `gh issue list --label needs-spec --json number,title,body`.
   If the repo has no `needs-spec` label (`gh label list`), use the same fallback `groom`
   uses: open issues that are unlabelled and have no **Acceptance** list
   (`gh issue list --json number,title,body,labels`, then filter).
   File-based: entries in `BACKLOG.md` (or `TODO.md`) without an **Acceptance** list.
   Skip items that already carry the `<!-- groom-prep:v1 -->` marker unless asked to refresh.
2. **Draft, for each item:**
   - **Title** — what it should be called.
   - **Acceptance** — 3 to 5 lines, each checkable pass/fail by someone who did not write
     it: "`POST /links` with an expired slug returns 410", "`npm test` exits 0". Vague
     criteria produce vague work.
   - **Open questions** — the 1 or 2 things only the human can decide (scope, taste, a
     product call). Write each as a choice with named options, exactly one marked
     `[recommended]`, one line of trade-off per option. Zero questions: it is probably
     ready already. Three or more: it probably needs splitting.
   - **Recommendation** — `promote` / `reshape` / `drop` / `split`, one line of why. For
     `split`, list the children inline; do not create issues.
   - **Size** — S / M / L, and whether a faithful implementation is enough
     (`loop-eligible`) or the output needs the human's taste (`taste-heavy`).
3. **Persist the draft into the item**, exactly this block, so `/groom` can parse it:

```
<!-- groom-prep:v1 -->
**Groom prep — draft for review**
- rec: promote — <why>
- size: M · loop-eligible
- acceptance:
  - [ ] <checkable line>
  - [ ] <checkable line>
- questions:
  - q: <the choice>
    options:
      - <A> [recommended] — <trade-off>
      - <B> — <trade-off>
- reshape: <only for reshape/split>
<!-- /groom-prep -->
```

GitHub: `gh issue comment <n> --body-file <draft>`. File-based: append the block under the
item. Never run in `--dry-run` unless asked; the block is the deliverable.

4. **Report one line:** "drafted N items; M already had drafts." Nothing else changes.

## Hard rules

- Never relabel to `ready`, never close, never merge, never ask. Ambiguity goes into the
  open questions with `rec: reshape`.
- Acceptance lines must be checkable; if you cannot write them so, the rec is `reshape`
  or `split`, not `promote`.
- Idempotent: an item with the marker is left alone.
