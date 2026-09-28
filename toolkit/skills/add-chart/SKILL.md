---
name: add-chart
description: Add a chart to the single-file dashboard in the house pattern it already uses. Use when asked to add a chart, series or panel to dashboard/index.html.
arguments: [metric, kind]
argument-hint: <metric> <chart-type>
---

# Add chart

Add a **$kind** chart of **$metric** to `dashboard/index.html` so it looks like it was
there from the start.

## Steps

0. **If `$metric` is empty, stop and ask** which metric and which chart type, in one
   question. Do not guess a metric from the dashboard.
1. **Read the house pattern before writing anything.** Open `dashboard/index.html` and
   note, in one line each: the palette (colour variables or literals), the layout grid
   (how panels are arranged and sized), how data is loaded (CSV fetch, inline array, or
   `/api/stats`), how numbers and dates are formatted, and how existing charts are drawn
   (a library, hand-rolled SVG, or canvas). Reuse all five. Do not add a library the file
   does not already use.
2. **Find the data.** Decide where `$metric` comes from: a column in `data/*.csv`, a field
   of `/api/stats`, or a derivation of one. If it does not exist, say so and stop.
3. **Add one panel.** Same markup as the neighbouring panels, a title in the same style,
   an element with `id="chart-$metric"`, and the drawing code next to the existing
   drawing code. A `$kind` chart means exactly that; if the pattern has no `$kind`, build
   it from the same primitives the file already uses.
4. **Check it renders.** At minimum: `grep -c 'id="chart-$metric"' dashboard/index.html`
   returns 1 and the file still parses (open it, or `node -e` a quick HTML sanity check).
   If a browser tool is available, open the page and look at the new panel. Otherwise
   open `dashboard/index.html` in a browser for the user (`open dashboard/index.html` on
   macOS, `xdg-open dashboard/index.html` on Linux) and ask what they see; do not claim to
   have seen it.
5. **Report** in three lines: what was added, which pattern elements were reused, what
   was verified and how. No screenshots described as "looks good"; say what you saw.

## Rules

- One chart per run. If asked for two, run twice.
- Never change existing panels to make room. Extend the grid.
- If a column the chart needs arrives in more than one format, handle every format you
  find and say so in the report.
