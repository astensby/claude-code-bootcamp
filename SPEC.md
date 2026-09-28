# SPEC — Links can expire (issue #1)

Written after a short interview on the issue. Decisions first, alternatives after.

## Behaviour

- `POST /links` accepts an optional `expires_at`, ISO 8601. Absent or `null` means the link never expires.
- `expires_at` that does not parse, or is not in the future at the time of the request, returns `400` with `{ "error": ... }`.
- `GET /:slug` on a link whose `expires_at` has passed returns `410 Gone` with a small HTML page ("This link has expired"). No click is recorded.
- `GET /api/links` returns `expires_at` for every link: the ISO string, or `null`. `/links` shows an **Expires** column and greys out expired rows.
- Expired links stay in the store. Nothing is deleted.

## Stats of expired links (the open question)

Decision: **keep and show, marked.** `/api/stats` keeps counting the clicks an expired link received while it was live; `top_links` rows carry `expired: true|false` so a dashboard can grey them out.

Alternatives considered:
- *Hide them* — stats would change the day a link expires, which makes week-over-week numbers lie.
- *Delete the link* — loses the audit trail and frees the slug for reuse, which would silently redirect old clicks somewhere new.

## Out of scope

- Editing `expires_at` after creation.
- A "renew" action.
- Purging expired links.

## Acceptance (from the issue, checked)

- [ ] `POST /links` accepts an optional `expires_at`; past or unparseable → `400`
- [ ] `GET /:slug` on an expired link returns `410` with an HTML body and records no click
- [ ] `GET /api/links` includes `expires_at` (or `null`) for every link; `/links` shows it
- [ ] `npm test` covers create-with-expiry and the 410 path
