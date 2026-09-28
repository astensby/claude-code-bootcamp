# PLAN — Links can expire

1. `app/src/store.ts` — add `expires_at?: string | null` to `Link`. Check: `npx tsc -p .` clean.
2. `app/src/validate.ts` — `validateExpiresAt(value)` (absent ok, must parse, must be in the future) and `isExpired(link)`. Check: unit tests in `app/test/validate.test.ts`.
3. `app/src/api/links.ts` — `createLink` validates and stores `expires_at` (normalised to ISO); `listLinks` returns `expires_at` or `null` for every row; `stats` marks `top_links` rows with `expired`. Check: `app/test/api.test.ts` create-with-expiry 201, past 400, unparseable 400, list shows `null`.
4. `app/src/redirect.ts` — expired link → `410` HTML, no click recorded. Check: api test "expired link returns 410 and records no click".
5. `app/src/web/links.html` — Expires column, expired rows greyed. Check: open `/links` after creating one link with and one without expiry.
6. `npm test`, `npm run lint`, then commit on `ex2-expiry`.
