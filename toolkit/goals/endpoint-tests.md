# Goal: every endpoint has a test
Note: green on `main` today, so running it there ends in one turn. It is the goal to run after a PR adds a route (issues #2 custom aliases, #3 CSV export, #6 `/stats`); add the new route to the ROUTES block in `toolkit/scripts/check-endpoint-tests.sh` first, then run the goal on that branch.
End state: each route the server serves is named in at least one test, and the suite is green.
Check: bash toolkit/scripts/check-endpoint-tests.sh && npm test --silent
Bound: 6 turns; only app/test/ may change; a test must assert a status code and a body field, not just "does not throw".
