# data/

Click export from linkr, cut on 2026-09-20. Twelve weeks (29 Jun – 20 Sep 2026), 300 links, 50 000 clicks.
Load it into the app with `npm run seed`.

## clicks.csv (50 000 rows)

| column | meaning |
|---|---|
| `ts` | when the click happened, UTC |
| `slug` | the short link that was clicked (→ `links.csv`) |
| `referrer` | hostname of the page the visitor came from; `newsletter` for tracked mail, `direct` when unknown |
| `country` | ISO 3166-1 alpha-2 of the visitor |
| `device` | `mobile`, `desktop` or `tablet` |

## links.csv (300 rows)

| column | meaning |
|---|---|
| `slug` | six-character short code, unique |
| `target_url` | where the short link redirects; about a third of the campaign links carry `?utm_campaign=<campaign_id>`, links without a campaign carry no utm parameter |
| `created_at` | when the link was created, UTC ISO 8601; always before the link's first click |
| `owner` | first name of the person who created it |
| `campaign_id` | the campaign it belongs to (→ `campaigns.csv`), empty when none |

## campaigns.csv (20 rows)

| column | meaning |
|---|---|
| `campaign_id` | `cmp-01` … `cmp-20` |
| `name` | campaign name |
| `channel` | `email`, `social`, `paid`, `partner` or `organic` |
| `start`, `end` | campaign window, dates |

## alt/

Two public datasets, if you would rather build the E1 dashboard on data that is not the app's own:
Statistics Norway (private cars by fuel and municipality) and Brønnøysundregistrene (employers with 50+ staff, sole proprietorships left out).
Offline copies with their own README next to each file. If you build on these, issue #3 replaces #6 in the E4 stretch and long form.
