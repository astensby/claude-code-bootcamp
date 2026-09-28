#!/usr/bin/env node
/**
 * Build dashboard/index.html from data/*.csv.
 *
 *   node dashboard/build.mjs            # reads ../data relative to this file, writes ./index.html
 *   node dashboard/build.mjs <repo-root> [out.html]
 *
 * No dependencies. Pre-computes every number the page shows and embeds them as one
 * DATA object, so the dashboard works from file:// with no fetch.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(process.argv[2] ?? join(here, ".."));
const OUT = resolve(process.argv[3] ?? join(here, "index.html"));
const DATA_DIR = join(ROOT, "data");

// ---------------------------------------------------------------- read
function readCsv(file) {
  const [header, ...lines] = readFileSync(join(DATA_DIR, file), "utf8").trim().split("\n");
  const cols = header.split(",");
  return lines.map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? ""]));
  });
}

/** ts arrives as ISO 8601 UTC, and ~2% as legacy "DD/MM/YYYY HH:mm" (also UTC). */
let legacyCount = 0;
function parseTs(ts) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(ts);
  if (m) {
    legacyCount++;
    return Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
  }
  const t = Date.parse(ts);
  if (Number.isNaN(t)) throw new Error(`unparseable ts: ${ts}`);
  return t;
}

const links = readCsv("links.csv");
const clicks = readCsv("clicks.csv");
const campaigns = readCsv("campaigns.csv");
const targetOf = new Map(links.map((l) => [l.slug, l.target_url]));

// ---------------------------------------------------------------- aggregate
const count = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const perSlug = new Map();
const perDay = new Map();
const perWeekday = new Array(7).fill(0); // Mon..Sun
const perReferrer = new Map();
const perDevice = new Map();
const perCountry = new Map();
let tMin = Infinity;
let tMax = -Infinity;

for (const c of clicks) {
  const t = parseTs(c.ts);
  tMin = Math.min(tMin, t);
  tMax = Math.max(tMax, t);
  const d = new Date(t);
  count(perSlug, c.slug);
  count(perDay, d.toISOString().slice(0, 10));
  perWeekday[(d.getUTCDay() + 6) % 7]++;
  count(perReferrer, c.referrer);
  count(perDevice, c.device);
  count(perCountry, c.country);
}

const desc = (map) => [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const topN = (map, n) => {
  const rows = desc(map);
  const head = rows.slice(0, n).map(([name, clicks]) => ({ name, clicks }));
  const rest = rows.slice(n).reduce((s, [, v]) => s + v, 0);
  if (rest > 0) head.push({ name: "other", clicks: rest, other: true });
  return head;
};

// every day in the window, zero-filled
const dayStart = Date.UTC(new Date(tMin).getUTCFullYear(), new Date(tMin).getUTCMonth(), new Date(tMin).getUTCDate());
const byDay = [];
for (let t = dayStart; t <= tMax; t += 864e5) {
  const day = new Date(t).toISOString().slice(0, 10);
  byDay.push({ day, clicks: perDay.get(day) ?? 0 });
}

const topLinks = desc(perSlug)
  .slice(0, 10)
  .map(([slug, clicks]) => ({ slug, target_url: targetOf.get(slug) ?? "", clicks }));

const total = clicks.length;
const busiest = byDay.reduce((a, b) => (b.clicks > a.clicks ? b : a));
const topReferrer = desc(perReferrer)[0];

const DATA = {
  generated: new Date().toISOString().slice(0, 10),
  window: { from: byDay[0].day, to: byDay[byDay.length - 1].day, days: byDay.length },
  totals: {
    clicks: total,
    links: links.length,
    links_with_clicks: perSlug.size,
    top10_share: topLinks.reduce((s, l) => s + l.clicks, 0) / total,
    campaigns: campaigns.length,
    avg_per_day: Math.round(total / byDay.length),
    busiest_day: busiest.day,
    busiest_clicks: busiest.clicks,
    top_referrer: topReferrer[0],
    top_referrer_share: topReferrer[1] / total,
    legacy_ts_rows: legacyCount,
  },
  top_links: topLinks,
  by_day: byDay,
  by_weekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, i) => ({ name, clicks: perWeekday[i] })),
  by_referrer: topN(perReferrer, 8),
  by_device: topN(perDevice, 3),
  by_country: topN(perCountry, 8),
};

// ---------------------------------------------------------------- page
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>linkr · click dashboard</title>
<style>
  /* Palette: one accent for data, ink for text, greys for everything that is not data. */
  :root {
    color-scheme: light;
    --surface: #fcfcfb;
    --card: #ffffff;
    --border: #e6e5e1;
    --grid: #ecebe7;
    --ink: #0b0b0b;
    --ink-2: #52514e;
    --ink-3: #8a8985;
    --accent: #2a78d6;
    --accent-soft: rgba(42, 120, 214, 0.10);
    --muted-bar: #c9c8c2;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --surface: #1a1a19;
      --card: #222221;
      --border: #33332f;
      --grid: #2e2e2b;
      --ink: #ffffff;
      --ink-2: #c3c2b7;
      --ink-3: #8a8985;
      --accent: #3987e5;
      --accent-soft: rgba(57, 135, 229, 0.14);
      --muted-bar: #4a4a46;
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --surface: #1a1a19; --card: #222221; --border: #33332f; --grid: #2e2e2b;
    --ink: #ffffff; --ink-2: #c3c2b7; --ink-3: #8a8985;
    --accent: #3987e5; --accent-soft: rgba(57, 135, 229, 0.14); --muted-bar: #4a4a46;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2rem 1.5rem 3rem;
    background: var(--surface); color: var(--ink);
    font: 15px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  main { max-width: 1280px; margin: 0 auto; }
  header { display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem 1.5rem; margin-bottom: 1.25rem; }
  h1 { font-size: 1.5rem; margin: 0; font-weight: 650; letter-spacing: -0.01em; }
  header p { margin: 0; color: var(--ink-2); }

  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr)); gap: 12px; margin-bottom: 12px; }
  .tile { min-width: 0; overflow-wrap: anywhere; background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
  .tile .label { color: var(--ink-2); font-size: .85rem; }
  .tile .value { font-size: clamp(1.2rem, 4.5vw, 1.75rem); font-weight: 600; letter-spacing: -0.02em; margin-top: 2px; font-variant-numeric: tabular-nums; }
  .tile .sub { color: var(--ink-3); font-size: .8rem; margin-top: 2px; }

  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 16px 18px 12px; position: relative; min-width: 0; }
  .card.wide { grid-column: 1 / -1; }
  .card h2 { font-size: 1rem; font-weight: 600; margin: 0 0 2px; }
  .card .sub { color: var(--ink-2); font-size: .85rem; margin: 0 0 10px; }
  .card h3 { font-size: .8rem; font-weight: 500; color: var(--ink-3); margin: 10px 0 4px; text-transform: uppercase; letter-spacing: .04em; }
  .card svg { display: block; width: 100%; height: auto; overflow: visible; }
  @media (max-width: 800px) { .grid { grid-template-columns: minmax(0, 1fr); } }

  /* marks */
  .bar { fill: var(--accent); }
  .bar.other { fill: var(--muted-bar); }
  .bar-row:hover .bar { opacity: .8; }
  .grid-line { stroke: var(--grid); stroke-width: 1; }
  .axis-text { fill: var(--ink-2); font-size: 12px; }
  .value-text { fill: var(--ink); font-size: 12px; font-variant-numeric: tabular-nums; }
  .label-text { fill: var(--ink); font-size: 12.5px; }
  .label-sub { fill: var(--ink-3); font-size: 11px; }
  .line { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .area { fill: var(--accent-soft); }
  .peak-dot { fill: var(--accent); stroke: var(--card); stroke-width: 2; }
  .crosshair { stroke: var(--ink-3); stroke-width: 1; pointer-events: none; }
  .hover-dot { fill: var(--accent); stroke: var(--card); stroke-width: 2; pointer-events: none; }
  .hit { fill: transparent; }

  .tooltip {
    position: absolute; pointer-events: none; display: none;
    background: var(--ink); color: var(--surface); font-size: 12px; line-height: 1.35;
    padding: 6px 9px; border-radius: 6px; white-space: nowrap; transform: translate(-50%, -100%);
  }

  details { margin-top: 8px; }
  summary { cursor: pointer; color: var(--ink-2); font-size: .85rem; }
  table { border-collapse: collapse; width: 100%; font-size: .85rem; margin-top: 6px; }
  th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--border); }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.url { max-width: min(26rem, 45vw); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink-2); }
  details > div { overflow-x: auto; }

  .assumptions { margin-top: 20px; color: var(--ink-2); font-size: .9rem; }
  .assumptions h2 { font-size: 1rem; color: var(--ink); margin: 0 0 6px; }
  .assumptions ol { margin: 0; padding-left: 1.25rem; }
  .assumptions li { margin: 3px 0; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; }
</style>
</head>
<body>
<main>
  <header>
    <h1>linkr · click dashboard</h1>
    <p id="subtitle"></p>
  </header>

  <div class="tiles" id="tiles"></div>

  <div class="grid">
    <section class="card wide">
      <h2>Clicks per day</h2>
      <p class="sub">How traffic moves over the twelve weeks. Hover for a day.</p>
      <div id="by-day"></div>
    </section>

    <section class="card">
      <h2>Top 10 links</h2>
      <p class="sub">Which links get the most clicks.</p>
      <div id="top-links"></div>
      <details><summary>Show as table</summary><div id="top-links-table"></div></details>
    </section>

    <section class="card">
      <h2>Referrers</h2>
      <p class="sub">Where visitors come from. Top 8, rest folded into other.</p>
      <div id="by-referrer"></div>
      <details><summary>Show as table</summary><div id="by-referrer-table"></div></details>
    </section>

    <section class="card">
      <h2>Clicks per weekday</h2>
      <p class="sub">Same twelve weeks, by day of the week.</p>
      <div id="by-weekday"></div>
    </section>

    <section class="card">
      <h2>Devices and countries</h2>
      <p class="sub">Share of clicks. Countries: top 8, rest folded into other.</p>
      <h3>Devices</h3>
      <div id="by-device"></div>
      <h3>Countries</h3>
      <div id="by-country"></div>
    </section>
  </div>

  <section class="assumptions" id="assumptions">
    <h2>Assumptions</h2>
    <ol>
      <li>All timestamps are UTC. Days and weekdays are cut at UTC midnight, not local time.</li>
      <li>About 2% of <code>ts</code> values (<span id="legacy-count"></span> rows) use <code>DD/MM/YYYY HH:mm</code> instead of ISO 8601. They were parsed as day-first UTC and kept, not dropped.</li>
      <li><code>newsletter</code> and <code>direct</code> are not hostnames: they mean tracked mail and unknown source. They are shown as referrers anyway.</li>
      <li>A click is a row in <code>clicks.csv</code>. No bot filtering, no de-duplication.</li>
      <li>"Top links" counts every click in the window regardless of when the link was created, so an old link can outrank a new one that is doing better per day.</li>
      <li>The window is twelve full weeks, Monday to Sunday, so every weekday appears exactly twelve times in the weekday chart.</li>
      <li>Numbers are pre-computed by <code>dashboard/build.mjs</code> from <code>data/</code>; rebuild after <code>npm run gen-data</code>.</li>
    </ol>
  </section>
</main>

<script>
/*
 * House pattern (add a chart the same way):
 *   1. palette lives in CSS custom properties (--accent, --ink-2, --grid …) — never hex in JS
 *   2. one <section class="card"> per chart, with an <h2> and a <p class="sub">
 *   3. one draw<Name>(el, data) function per chart, building inline SVG with el()/svg()
 *   4. all numbers come from the DATA object below (built by build.mjs, no fetch)
 *   5. render() calls every draw function in order — register new charts there
 *   6. text uses the ink tokens; only marks use --accent
 */
const DATA = ${JSON.stringify(DATA)};

const fmt = (n) => n.toLocaleString("en-US");
const pct = (x) => (x * 100).toFixed(0) + "%";
const SVG_NS = "http://www.w3.org/2000/svg";

function svg(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) node.append(typeof c === "string" ? document.createTextNode(c) : c);
  return node;
}
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}
function niceMax(max) {
  const p = 10 ** Math.floor(Math.log10(max));
  const f = max / p;
  const step = f <= 1 ? 0.2 : f <= 2 ? 0.5 : f <= 5 ? 1 : 2;
  return Math.ceil(f / step) * step * p;
}
function ticks(max, n = 4) {
  const top = niceMax(max);
  return Array.from({ length: n + 1 }, (_, i) => Math.round((top / n) * i));
}
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

/* ---- tiles ---------------------------------------------------------- */
function drawTiles(root, t) {
  const tile = (label, value, sub) => el("div", { class: "tile" }, [
    el("div", { class: "label", text: label }),
    el("div", { class: "value", text: value }),
    el("div", { class: "sub", text: sub }),
  ]);
  root.append(
    tile("Total clicks", fmt(t.clicks), DATA.window.days + " days, " + fmt(t.avg_per_day) + " per day"),
    tile("Links", fmt(t.links), "top 10 take " + pct(t.top10_share) + " of all clicks"),
    tile("Busiest day", fmt(t.busiest_clicks), t.busiest_day),
    tile("Top referrer", t.top_referrer, pct(t.top_referrer_share) + " of all clicks"),
  );
}

/* ---- horizontal bars ------------------------------------------------ */
function drawBars(root, rows, { label, sub, W = 600, rowH = 30, labelW = 150 } = {}) {
  const max = Math.max(...rows.map((r) => r.clicks));
  const H = rows.length * rowH + 4;
  const x0 = labelW + 8;
  const plotW = W - x0 - 60;
  const root_ = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
  rows.forEach((r, i) => {
    const y = i * rowH + 2;
    const w = Math.max(2, (r.clicks / max) * plotW);
    const g = svg("g", { class: "bar-row" });
    const name = label(r);
    g.append(svg("text", { x: labelW, y: y + 14, "text-anchor": "end", class: "label-text" }, [truncate(name, 20)]));
    if (sub) g.append(svg("text", { x: labelW, y: y + 26, "text-anchor": "end", class: "label-sub" }, [truncate(sub(r), 32)]));
    // 4px rounded data-end, square at the baseline: a path, not a rect
    const bh = 20;
    const rr = Math.min(4, w / 2);
    const d = "M" + x0 + " " + (y + 3) + " h" + (w - rr) + " a" + rr + " " + rr + " 0 0 1 " + rr + " " + rr + " v" + (bh - 2 * rr) + " a" + rr + " " + rr + " 0 0 1 -" + rr + " " + rr + " h-" + (w - rr) + " z";
    g.append(svg("path", { d, class: "bar" + (r.other ? " other" : "") }));
    g.append(svg("text", { x: x0 + w + 6, y: y + 17, class: "value-text" }, [fmt(r.clicks)]));
    g.append(svg("title", {}, [name + ": " + fmt(r.clicks) + " clicks"]));
    root_.append(g);
  });
  root.append(root_);
}

function drawTopLinks(root, rows) {
  drawBars(root, rows, { label: (r) => r.slug, sub: (r) => r.target_url.replace(/^https?:\\/\\//, ""), rowH: 34, labelW: 190 });
}
function drawReferrers(root, rows) {
  drawBars(root, rows, { label: (r) => r.name, labelW: 160 });
}
function drawDevices(root, rows) {
  const total = rows.reduce((s, r) => s + r.clicks, 0);
  drawBars(root, rows.map((r) => ({ ...r, name: r.name + " · " + pct(r.clicks / total) })), { label: (r) => r.name, rowH: 26, labelW: 150 });
}
function drawCountries(root, rows) {
  drawBars(root, rows, { label: (r) => r.name, rowH: 24, labelW: 150 });
}

/* ---- columns (weekday) ---------------------------------------------- */
function drawWeekday(root, rows) {
  const W = 600, H = 220, padL = 50, padB = 28, padT = 16;
  const plotW = W - padL - 10, plotH = H - padB - padT;
  const tk = ticks(Math.max(...rows.map((r) => r.clicks)));
  const top = tk[tk.length - 1];
  const s = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
  for (const t of tk) {
    const y = padT + plotH - (t / top) * plotH;
    s.append(svg("line", { x1: padL, x2: W - 10, y1: y, y2: y, class: "grid-line" }));
    s.append(svg("text", { x: padL - 8, y: y + 4, "text-anchor": "end", class: "axis-text" }, [fmt(t)]));
  }
  const slot = plotW / rows.length;
  const bw = Math.min(24, slot * 0.6);
  rows.forEach((r, i) => {
    const h = (r.clicks / top) * plotH;
    const x = padL + slot * i + (slot - bw) / 2;
    const y = padT + plotH - h;
    const rr = Math.min(4, bw / 2);
    const d = "M" + x + " " + (y + rr) + " a" + rr + " " + rr + " 0 0 1 " + rr + " -" + rr + " h" + (bw - 2 * rr) + " a" + rr + " " + rr + " 0 0 1 " + rr + " " + rr + " v" + (h - rr) + " h-" + bw + " z";
    const g = svg("g", { class: "bar-row" }, [
      svg("path", { d, class: "bar" }),
      svg("text", { x: x + bw / 2, y: y - 6, "text-anchor": "middle", class: "value-text" }, [fmt(r.clicks)]),
      svg("text", { x: x + bw / 2, y: H - 8, "text-anchor": "middle", class: "axis-text" }, [r.name]),
      svg("title", {}, [r.name + ": " + fmt(r.clicks) + " clicks"]),
    ]);
    s.append(g);
  });
  root.append(s);
}

/* ---- line + area (per day) ------------------------------------------ */
function drawByDay(root, rows) {
  const W = 1240, H = 300, padL = 56, padR = 20, padT = 20, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const tk = ticks(Math.max(...rows.map((r) => r.clicks)));
  const top = tk[tk.length - 1];
  const xOf = (i) => padL + (i / (rows.length - 1)) * plotW;
  const yOf = (v) => padT + plotH - (v / top) * plotH;
  const s = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });

  for (const t of tk) {
    s.append(svg("line", { x1: padL, x2: W - padR, y1: yOf(t), y2: yOf(t), class: "grid-line" }));
    s.append(svg("text", { x: padL - 8, y: yOf(t) + 4, "text-anchor": "end", class: "axis-text" }, [fmt(t)]));
  }
  // one x label per Monday
  rows.forEach((r, i) => {
    const d = new Date(r.day + "T00:00:00Z");
    if (d.getUTCDay() !== 1) return;
    const label = d.getUTCDate() + " " + d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    s.append(svg("text", { x: xOf(i), y: H - 10, "text-anchor": "middle", class: "axis-text" }, [label]));
  });

  const pts = rows.map((r, i) => xOf(i).toFixed(1) + " " + yOf(r.clicks).toFixed(1));
  s.append(svg("path", { d: "M" + pts.join(" L") + " L" + xOf(rows.length - 1) + " " + yOf(0) + " L" + xOf(0) + " " + yOf(0) + " Z", class: "area" }));
  s.append(svg("path", { d: "M" + pts.join(" L"), class: "line" }));

  // label the extreme only
  const peakI = rows.reduce((best, r, i) => (r.clicks > rows[best].clicks ? i : best), 0);
  const peak = rows[peakI];
  s.append(svg("circle", { cx: xOf(peakI), cy: yOf(peak.clicks), r: 4.5, class: "peak-dot" }));
  const anchor = peakI > rows.length * 0.8 ? "end" : "start";
  const dx = anchor === "end" ? -10 : 10;
  s.append(svg("text", { x: xOf(peakI) + dx, y: yOf(peak.clicks) - 8, "text-anchor": anchor, class: "value-text" }, ["peak " + fmt(peak.clicks) + " · " + peak.day]));

  // hover: crosshair + dot + tooltip
  const cross = svg("line", { x1: 0, x2: 0, y1: padT, y2: padT + plotH, class: "crosshair", visibility: "hidden" });
  const dot = svg("circle", { r: 4.5, class: "hover-dot", visibility: "hidden" });
  const hit = svg("rect", { x: padL, y: padT, width: plotW, height: plotH, class: "hit" });
  s.append(cross, dot, hit);
  const tip = el("div", { class: "tooltip" });
  root.style.position = "relative";
  root.append(s, tip);

  hit.addEventListener("mousemove", (e) => {
    const rect = s.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.max(0, Math.min(rows.length - 1, Math.round(((x - padL) / plotW) * (rows.length - 1))));
    const r = rows[i];
    cross.setAttribute("x1", xOf(i)); cross.setAttribute("x2", xOf(i)); cross.setAttribute("visibility", "visible");
    dot.setAttribute("cx", xOf(i)); dot.setAttribute("cy", yOf(r.clicks)); dot.setAttribute("visibility", "visible");
    const wd = new Date(r.day + "T00:00:00Z").toLocaleString("en-US", { weekday: "short", timeZone: "UTC" });
    tip.textContent = wd + " " + r.day + " · " + fmt(r.clicks) + " clicks";
    tip.style.display = "block";
    tip.style.left = (xOf(i) / W) * rect.width + "px";
    tip.style.top = (yOf(r.clicks) / H) * rect.height - 10 + "px";
  });
  hit.addEventListener("mouseleave", () => {
    cross.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); tip.style.display = "none";
  });
}

/* ---- tables (the non-chart view) ------------------------------------ */
function drawTable(root, rows, cols) {
  const table = el("table");
  table.append(el("thead", {}, [el("tr", {}, cols.map((c) => el("th", { class: c.num ? "num" : "", text: c.label })))]));
  table.append(el("tbody", {}, rows.map((r) => el("tr", {}, cols.map((c) => el("td", { class: (c.num ? "num " : "") + (c.cls ?? ""), text: c.get(r) }))))));
  root.append(table);
}

/* ---- render --------------------------------------------------------- */
function render() {
  document.getElementById("subtitle").textContent =
    DATA.window.from + " to " + DATA.window.to + " · built " + DATA.generated;
  document.getElementById("legacy-count").textContent = fmt(DATA.totals.legacy_ts_rows);
  drawTiles(document.getElementById("tiles"), DATA.totals);
  drawByDay(document.getElementById("by-day"), DATA.by_day);
  drawTopLinks(document.getElementById("top-links"), DATA.top_links);
  drawReferrers(document.getElementById("by-referrer"), DATA.by_referrer);
  drawWeekday(document.getElementById("by-weekday"), DATA.by_weekday);
  drawDevices(document.getElementById("by-device"), DATA.by_device);
  drawCountries(document.getElementById("by-country"), DATA.by_country);
  drawTable(document.getElementById("top-links-table"), DATA.top_links, [
    { label: "Slug", get: (r) => r.slug },
    { label: "Target", get: (r) => r.target_url, cls: "url" },
    { label: "Clicks", get: (r) => fmt(r.clicks), num: true },
  ]);
  drawTable(document.getElementById("by-referrer-table"), DATA.by_referrer, [
    { label: "Referrer", get: (r) => r.name },
    { label: "Clicks", get: (r) => fmt(r.clicks), num: true },
    { label: "Share", get: (r) => pct(r.clicks / DATA.totals.clicks), num: true },
  ]);
}
render();
</script>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`wrote ${OUT} (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`clicks ${total} · links ${links.length} · days ${byDay.length} · legacy ts rows ${legacyCount}`);
console.log("top 10:", topLinks.map((l) => `${l.slug}=${l.clicks}`).join(" "));
