#!/usr/bin/env bash
# check-endpoint-tests.sh — every route has a test that names it. Exit 1 otherwise.
# The route list is the contract; edit it when routes change (ADAPT).
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 1
TESTS=app/test

# ADAPT: one line per route: "<METHOD> <path>|<string a test must contain>". The needle is the exact
# route as a test names it (a describe title, or the quoted path in the pages test), so a test for
# /api/links cannot stand in for /links and a stray "302" cannot stand in for the redirect.
ROUTES="
POST /links|describe(\"POST /links\"
GET /api/links|describe(\"GET /api/links\"
GET /api/stats|describe(\"GET /api/stats\"
GET /:slug|describe(\"GET /:slug\"
GET /|[\"/\",
GET /links|\"/links\"]
"

missing=0
while IFS='|' read -r route needle; do
  [ -z "$route" ] && continue
  if grep -rqF -- "$needle" "$TESTS" 2>/dev/null; then echo "ok       $route"
  else echo "MISSING  $route  (no test mentions '$needle')"; missing=1; fi
done <<<"$ROUTES"
exit $missing
