# linkr — project instructions

## Facts the repo does not state
- Everything runs from the repo root: `npm test`, `npm run lint`, `npm run dev`. There is no package.json in `app/`.
- The store is one JSON file (`.data/store.json`, `LINKR_STORE` to override) rewritten on every change. Never edit it by hand while the app runs.
- `npm run seed` replaces the whole store with `data/*.csv`. Run it after any live check that created links.
- Tests start the app on port 0 with a temp store (`app/test/helpers.ts`). New endpoint tests go in `app/test/api.test.ts`.
- Redirect responses are read by a person in a browser: HTML bodies on 404 and 410, never JSON.
- `data/clicks.csv` is the source of truth for stats; `/api/stats` after `npm run seed` must match it.
- Slugs are generated from a 32-character alphabet without 0/o/1/l; keep it that way, they get read aloud.
- The lint warnings on main are known debt (issue #7). Do not fix them as a side effect of another change.

## Rules earned so far
- Before trusting any per-day number, check how `ts` is parsed: exports mix ISO 8601 with `DD/MM/YYYY HH:mm`, and dropping the odd rows silently shifts the daily curve. (E1)
- Return 410 with an HTML page for expired links, not JSON, and record no click: the visitor is a person mid-redirect, and expired traffic is not traffic. (E2)
- Validate at the edge: `expires_at` is checked in `validate.ts` like `target_url`; the store never sees a bad value. (E2)

## Working agreement
- Plans are files: options → `SPEC.md` → `PLAN.md` before code, on anything bigger than a one-line fix.
- Say what you verified and how. A change without a named test is not done.
- Do not widen an issue: if the acceptance list is met, stop and report what else you noticed.
