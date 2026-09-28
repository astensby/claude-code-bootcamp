# Backlog

Eight issues. `scripts/seed-issues.sh` creates them in your repo, in this order, with these labels. Each block is one issue: the heading is the title, the `Labels:` line is the labels, everything down to `---` is the body.

## 1 · Links can expire
Labels: ex2

A link can be created with an optional `expires_at` (ISO 8601). After that time, `GET /:slug` returns `410 Gone` with a small page saying the link has expired instead of redirecting. `GET /api/links` and the `/links` page show the expiry where one is set.

Open question for the spec: what happens to the click stats of an expired link? Keep them, hide them, or mark them?

**Acceptance**
- [ ] `POST /links` accepts an optional `expires_at`; a value in the past or not parseable as ISO 8601 returns `400`
- [ ] `GET /:slug` on an expired link returns `410` and an HTML body, and records no click
- [ ] `GET /api/links` includes `expires_at` (or `null`) for every link; `/links` shows it
- [ ] `npm test` covers create-with-expiry and the 410 path

---

## 2 · Custom aliases
Labels: ex4

Let the user choose the slug on create: `POST /links` with `{ "target_url": "...", "slug": "MyLink" }`. Rules: 3–32 characters, letters, digits, `-` and `_`. A slug that is already taken returns `409 Conflict`. The reserved words `api`, `links` and `stats` are rejected with `400`. Without a `slug` the API keeps generating one.

**Acceptance**
- [ ] `POST /links` with a valid `slug` returns `201` and that slug
- [ ] A slug that breaks the rules returns `400`; a taken slug returns `409`
- [ ] A reserved word (`api`, `links`, `stats`) as the slug returns `400`
- [ ] `/MyLink` and `/mylink` resolve to the same target
- [ ] `npm test` covers all three status codes

---

## 3 · CSV export of stats
Labels: ex4-alt

Add `GET /api/stats.csv?since=<iso>` returning the same numbers as `GET /api/stats`, as CSV with a header row: one section per array (`top_links`, `by_day`, `by_referrer`) or three files, your call, documented in `app/README.md`.

**Acceptance**
- [ ] `GET /api/stats.csv` returns `200` with `Content-Type: text/csv`
- [ ] The totals in the CSV equal the totals in `GET /api/stats` for the same `since`
- [ ] `npm test` covers the endpoint with seeded data

---

## 4 · Rate-limit link creation
Labels: ex4

Limit `POST /links` to N requests per minute per client IP (N configurable, default 10). Over the limit, respond `429 Too Many Requests` with a `Retry-After` header in seconds. Reads are never limited.

**Acceptance**
- [ ] The 11th `POST /links` from one IP inside a minute returns `429` with `Retry-After`
- [ ] The limit is per IP; another IP is not affected
- [ ] `GET` routes are unaffected
- [ ] `npm test` covers the limit and the header

---

## 5 · Bad target URL is accepted
Labels: ex3, ex4

`POST /links` with `{ "target_url": "not a url" }` returns `201` and stores the link. It should return `400`. Only `http:` and `https:` targets are valid.

**Acceptance**
- [ ] `POST /links` with `target_url: "not a url"` returns `400`
- [ ] `POST /links` with `target_url: "ftp://x"` returns `400`
- [ ] Valid `http://` and `https://` targets still return `201`
- [ ] `npm test` covers the rejection

---

## 6 · Serve my dashboard at /stats with live numbers
Labels: ex4

Take `dashboard/index.html`, serve it at `GET /stats`, and replace however it gets its numbers today (CSV parsing or embedded data) with a fetch of `/api/stats` so they are live. Keep the layout and charts as they are.

**Acceptance**
- [ ] `GET /stats` returns `200` with the dashboard HTML
- [ ] The page loads its data from `/api/stats`, not from `data/*.csv`
- [ ] After `npm run seed` (seed before starting the server), the top-5 links on `/stats` are the same five as in the CSV version
- [ ] `npm test` covers that `/stats` is served

---

## 7 · Lint debt to zero
Labels: ex5

`npm run lint` passes with around 40 warnings: unused imports and variables, `any`, non-null assertions. Bring it to zero without changing behaviour.

**Acceptance**
- [ ] `npx biome lint . --error-on-warnings` exits 0
- [ ] `npm test` still passes
- [ ] No `biome-ignore` comments added

---

## 8 · README documents --port, which doesn't exist
Labels: ex5

`app/README.md` says the server takes `--port`. It does not; the port comes from the `PORT` environment variable only. Make the docs match the code, and check the rest of the README against what `npm run dev` actually does.

**Acceptance**
- [ ] `app/README.md` documents `PORT` and no longer mentions `--port`
- [ ] Every command in `app/README.md` runs as written
- [ ] `npm test` still passes

---
