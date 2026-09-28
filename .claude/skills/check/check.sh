#!/usr/bin/env bash
# check.sh — the app's full check. One row per check, evidence on every row.
# Exit 0 only when every row is PASS. Run from anywhere inside the repo.
#
# Adapt it to your app in the ADAPT block below (see SKILL.md).

set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 1

# ---- ADAPT: what the live checks hit ------------------------------------------
VALID_URL="https://example.com/check-$$"   # a target_url the API must accept → 201
INVALID_URL="not a url"                     # a target_url the API must reject → 400
PAGE="/links"                               # ADAPT: the page a user opens to see the change
PAGE_MARKER="Expires"                       # the Expires column added in E2 proves the current page is served
# --------------------------------------------------------------------------------

ROWS=()
FAIL=0
row() { ROWS+=("| $1 | $2 | $3 |"); [ "$1" = "FAIL" ] && FAIL=1; return 0; }

TMP=$(mktemp -d)
APP=""
cleanup() {
  if [ -n "$APP" ]; then pkill -P "$APP" 2>/dev/null; kill "$APP" 2>/dev/null; fi
  [ -n "${PORT:-}" ] && lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null
  rm -rf "$TMP"
}
trap cleanup EXIT

# 1. Tests
out=$(npm test --silent 2>&1); code=$?
if [ $code -eq 0 ]; then row PASS "npm test" "exit 0, $(grep -oE '[0-9]+ passed' <<<"$out" | tail -1)"
else row FAIL "npm test" "exit $code: $(grep -E 'FAIL|failed|Error' <<<"$out" | head -1)"; fi

# 2. Lint (warnings pass here; the lint-debt goal is the strict one)
out=$(npm run lint --silent 2>&1); code=$?
warn=$(grep -oE 'Found [0-9]+ warning[s]?' <<<"$out" | tail -1)
if [ $code -eq 0 ]; then row PASS "npm run lint" "exit 0${warn:+, $warn}"
else row FAIL "npm run lint" "exit $code: $(grep -iE 'error' <<<"$out" | head -1)"; fi

# 3. Start the app on a free port with a throwaway store
PORT=$(node -e 'const s=require("net").createServer().listen(0,()=>{console.log(s.address().port);s.close()})')
export PORT
export LINKR_STORE="$TMP/store.json"
# one already-expired link, so the 410 path can be exercised on an otherwise empty store
printf '%s' '{"links":[{"slug":"expired1","target_url":"https://example.com/old","created_at":"2026-01-01T00:00:00Z","expires_at":"2026-01-02T00:00:00Z"}],"clicks":[]}' >"$LINKR_STORE"
npm run dev --silent >"$TMP/app.log" 2>&1 &
APP=$!
BASE="http://localhost:$PORT"
up=0
for _ in $(seq 1 50); do curl -fs "$BASE/" >/dev/null 2>&1 && { up=1; break; }; sleep 0.1; done
if [ $up -eq 1 ]; then row PASS "app starts" "$BASE answered within 5 s"
else row FAIL "app starts" "no answer on $BASE after 5 s: $(tail -1 "$TMP/app.log")"; fi

# 4. Live endpoints
code=$(curl -s -o "$TMP/create.json" -w '%{http_code}' -X POST "$BASE/links" \
  -H 'content-type: application/json' -d "{\"target_url\":\"$VALID_URL\"}")
slug=$(node -e 'try{process.stdout.write(String(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).slug||""))}catch{}' "$TMP/create.json")
if [ "$code" = "201" ] && [ -n "$slug" ]; then row PASS "POST /links valid url" "201, slug=$slug"
else row FAIL "POST /links valid url" "expected 201 with a slug, got $code"; fi

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/links" \
  -H 'content-type: application/json' -d "{\"target_url\":\"$INVALID_URL\"}")
if [ "$code" = "400" ]; then row PASS "POST /links invalid url" "400"
else row FAIL "POST /links invalid url" "expected 400, got $code"; fi

loc=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$BASE/$slug")
if [[ "$loc" == 302\ * && "$loc" == *"$VALID_URL" ]]; then row PASS "GET /:slug" "302 → $VALID_URL"
else row FAIL "GET /:slug" "expected 302 → $VALID_URL, got '$loc'"; fi

code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/no-such-slug-$$")
if [ "$code" = "404" ]; then row PASS "GET /unknown-slug" "404"
else row FAIL "GET /unknown-slug" "expected 404, got $code"; fi

if curl -s "$BASE/api/links" | grep -q "\"$slug\""; then row PASS "GET /api/links" "contains $slug"
else row FAIL "GET /api/links" "new slug $slug missing from the list"; fi

total=$(curl -s "$BASE/api/stats" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).total_clicks))}catch{process.stdout.write("?")}})')
if [ "$total" != "?" ] && [ "$total" -ge 1 ] 2>/dev/null; then row PASS "GET /api/stats" "total_clicks=$total after one redirect"
else row FAIL "GET /api/stats" "total_clicks=$total, expected >= 1"; fi

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/links" \
  -H 'content-type: application/json' -d "{\"target_url\":\"$VALID_URL\",\"expires_at\":\"2020-01-01T00:00:00Z\"}")
if [ "$code" = "400" ]; then row PASS "POST /links past expires_at" "400"
else row FAIL "POST /links past expires_at" "expected 400, got $code"; fi

code=$(curl -s -o "$TMP/gone.html" -w '%{http_code}' "$BASE/expired1")
if [ "$code" = "410" ] && grep -qi "expired" "$TMP/gone.html"; then row PASS "GET /:slug expired" "410 with an HTML page"
else row FAIL "GET /:slug expired" "expected 410 with an HTML page, got $code"; fi

after=$(curl -s "$BASE/api/stats" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).total_clicks))}catch{process.stdout.write("?")}})')
if [ "$after" = "$total" ]; then row PASS "expired click not counted" "total_clicks still $total after the 410"
else row FAIL "expired click not counted" "total_clicks went from $total to $after"; fi

# 5. One page
code=$(curl -s -o "$TMP/page.html" -w '%{http_code}' "$BASE$PAGE")
if [ "$code" = "200" ] && grep -q "$PAGE_MARKER" "$TMP/page.html"; then
  row PASS "page $PAGE" "200, contains '$PAGE_MARKER' (rows render client-side: open $BASE$PAGE to see $slug)"
else row FAIL "page $PAGE" "expected 200 with '$PAGE_MARKER', got $code"; fi

# 6. Report
echo "| Result | Check | Evidence |"
echo "|---|---|---|"
printf '%s\n' "${ROWS[@]}"
echo
if [ $FAIL -eq 0 ]; then echo "CHECK: PASS"; else echo "CHECK: FAIL ($(printf '%s\n' "${ROWS[@]}" | grep -c '^| FAIL') rows)"; fi
exit $FAIL
