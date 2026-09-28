# linkr

A small link shortener with click stats. `node:http`, a JSON-file store, no runtime dependencies.
Everything runs from the repository root.

## Run

```
npm ci
npm run seed          # load data/ into the store so /api/stats has numbers
npm run dev           # http://localhost:3000
npm run dev -- --port 4000   # pick another port
npm test
npm run typecheck     # tsc --noEmit
npm run lint
```

The store is a single JSON file, `.data/store.json` (gitignored). Point `LINKR_STORE` at another
path to use a different one, for example when seeding a scratch copy. The tests do not use it;
they build their own temp stores.

## Endpoints

| method · path | does |
|---|---|
| `POST /links` `{ "target_url": "https://…" }` | creates a short link → `201 { slug, target_url, created_at }`; a body over 64 KB gets `413` |
| `GET /:slug` | records the click, `302` to the target; `404` when unknown |
| `GET /api/links` | every link as JSON, newest first; after `npm run seed` each link also carries `owner` and `campaign_id` |
| `GET /api/stats?since=<iso>` | `{ total_clicks, top_links, by_day, by_referrer }`, optionally from a point in time (`YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ`) |
| `GET /` | create a link |
| `GET /links` | list links |

Every `GET` route also answers `HEAD`. A known path with another method gets `405` and an `Allow` header; an unknown path under `/api/` gets a JSON `404`.
A click's country is read from the optional `x-country` request header (`unknown` when absent); referrer and device come from `Referer` and `User-Agent`.

## Layout

```
app/src/server.ts      routes, static pages, startup
app/src/api/links.ts   POST /links · GET /api/links · GET /api/stats
app/src/redirect.ts    GET /:slug
app/src/store.ts       the JSON-file store
app/src/validate.ts    slug + URL rules, slug generation
app/src/web/           index.html · links.html
app/test/              vitest
```
