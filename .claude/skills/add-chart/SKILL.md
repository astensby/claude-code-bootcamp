---
name: add-chart
description: Add one chart to dashboard/index.html in the house pattern the file already uses. Use when asked to add a chart, panel or series to the dashboard.
arguments: [metric, kind]
argument-hint: <metric> <bars|line|columns>
---

# Add chart: $metric as $kind

Our dashboard is one file with one pattern. Read the six-line comment at the top of its
`<script>` first; it is the contract:

1. palette = CSS custom properties (`--accent`, `--ink-2`, `--grid`); no hex in JS
2. one `<section class="card">` per chart, with an `<h2>` and a `<p class="sub">`
3. one `draw<Name>(el, data)` per chart, built from `el()` / `svg()`; reuse `drawBars` for bars, `drawByDay` for a line, `drawWeekday` for columns
4. every number comes from `/api/stats` (and `/api/links` for the link count), fetched once on load into `DATA`
5. `render()` calls every draw function in order; register the new one there
6. text uses ink tokens; only marks use `--accent`

## Steps

1. Find `$metric`. It is either already a key on `DATA` (then use it), or it has to be
   computed server-side in `stats()` in `app/src/api/links.ts` (then add it to the JSON
   with the same `{ name, clicks }` row shape the other series use, add a test in
   `app/test/api.test.ts`, and map it in `load()` in the dashboard). If the store cannot
   answer it, say so and stop.
2. Add one `<section class="card" id="card-$metric">` after the last card in the grid,
   with an `<h2>` and a one-line `<p class="sub">`, and a `<div id="by-$metric">`.
3. Add `draw$Metric(root, rows)` next to the other draw functions. A `$kind` of `bars`
   wraps `drawBars`; `columns` copies `drawWeekday`; `line` copies `drawByDay`. Do not
   introduce a new primitive.
4. Register it in `render()`: `draw$Metric(document.getElementById("by-$metric"), DATA.$metric)`.
5. Check it renders:
   - `grep -c 'id="card-$metric"' dashboard/index.html` → 1
   - `"$(command -v google-chrome || echo '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')" --headless --disable-gpu --dump-dom dashboard/index.html | grep -c '<svg'` → one more than before
   - if the Chrome extension is connected, open the file and look at the new card
6. Report in three lines: what was added, which pattern pieces were reused, what you saw.

## Rules

- One chart per run.
- Never reshape existing cards to make room; the grid wraps.
- If the numbers look wrong, the bug is in `stats()` or `load()`, not in the draw function.
