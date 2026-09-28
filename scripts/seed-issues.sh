#!/usr/bin/env bash
# Create the eight bootcamp issues in YOUR repo from BACKLOG.md, plus the labels the toolkit loop uses.
# Templates do not copy issues, so run this once after cloning.
#   scripts/seed-issues.sh            # creates missing issues, in order 1..8
#   DRY_RUN=1 scripts/seed-issues.sh  # print what would be created, touch nothing
# The exercises refer to the issues as #1..#8. GitHub numbers issues and pull requests from one
# counter, so seed a fresh repo (no issues or PRs yet) and the numbers match; if they do not, the
# script says so loudly.
set -euo pipefail
cd "$(dirname "$0")/.."

BACKLOG=BACKLOG.md
[ -f "$BACKLOG" ] || { echo "BACKLOG.md not found"; exit 1; }
command -v gh >/dev/null || { echo "gh is required: https://cli.github.com"; exit 1; }

DRY_RUN="${DRY_RUN:-0}"
run() { if [ "$DRY_RUN" = 1 ]; then printf '    $'; printf ' %q' "$@"; echo; else "$@" >/dev/null; fi; }

if [ "$DRY_RUN" != 1 ]; then
  gh auth status >/dev/null 2>&1 || { echo "gh is not logged in. Run: gh auth login"; exit 1; }
  # gh reads the repo from the git remotes; with two remotes it needs a default.
  repo="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
  if [ -z "$repo" ]; then
    echo "gh cannot tell which repo this is: no GitHub remote, or two remotes without gh repo set-default."
    echo "Run: gh repo set-default <you>/claude-code-bootcamp   (then run this script again)"
    exit 1
  fi
  # Never seed the template itself.
  if [ "$(gh repo view --json isTemplate -q .isTemplate 2>/dev/null)" = "true" ]; then
    echo "$repo is the template. Seed issues in your own copy (Use this template on GitHub), not here."
    exit 1
  fi
else
  repo="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo '<your-repo>')"
fi
echo "Seeding issues into $repo"

# Labels. --force updates colour and description when the label already exists, so this is idempotent.
for l in ex2 ex3 ex4 ex4-alt ex5; do
  run gh label create "$l" --color 1D76DB --description "bootcamp exercise $l" --force
done
# The toolkit loop's labels (toolkit/loop/loop.md): needs-spec -> ready -> loop-review. No issue gets them here.
run gh label create needs-spec --color FBCA04 --description "loop: needs a spec before work starts" --force
run gh label create ready --color 0E8A16 --description "loop: spec agreed, ready to build" --force
run gh label create loop-review --color 5319E7 --description "loop: PR open, waiting for review" --force

# Existing titles, for idempotency
existing=""
if [ "$DRY_RUN" != 1 ]; then
  existing="$(gh issue list --state all --limit 200 --json title -q '.[].title' 2>/dev/null || true)"
fi

# Parse BACKLOG.md: "## N · Title" / "Labels: a, b" / body ... "---"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
awk -v dir="$tmp" '
  /^## [0-9]+ · / { n=$2; title=$0; sub(/^## [0-9]+ · /, "", title); out=dir "/" n; print title > (out ".title"); body=""; inbody=0; next }
  n && /^Labels:/ { l=$0; sub(/^Labels:[ ]*/, "", l); gsub(/ /, "", l); print l > (out ".labels"); inbody=1; next }
  n && /^---$/ { printf "%s", body > (out ".body"); close(out ".body"); n=""; inbody=0; next }
  n && inbody { body = body $0 "\n" }
' "$BACKLOG"

created=0; skipped=0; mismatched=0
for i in 1 2 3 4 5 6 7 8; do
  [ -f "$tmp/$i.title" ] || { echo "  ! issue $i missing in BACKLOG.md"; continue; }
  title="$(cat "$tmp/$i.title")"
  labels="$(cat "$tmp/$i.labels")"
  # trim leading/trailing blank lines from body
  body="$(sed -e :a -e '/./,$!d;/^\n*$/{$d;N;ba' -e '}' "$tmp/$i.body")"
  if printf '%s\n' "$existing" | grep -Fxq "$title"; then
    echo "  = #$i already exists: $title"; skipped=$((skipped+1)); continue
  fi
  echo "  + #$i $title  [$labels]"
  if [ "$DRY_RUN" = 1 ]; then
    run gh issue create --title "$title" --body "$body" --label "$labels"
  else
    url="$(gh issue create --title "$title" --body "$body" --label "$labels")"
    echo "    $url"
    number="${url##*/}"
    if [ "$number" != "$i" ]; then
      echo "    !!! GitHub numbered this issue #$number, not #$i. Where the exercises say #$i, read #$number."
      mismatched=$((mismatched+1))
    fi
  fi
  created=$((created+1))
done
echo "created $created, skipped $skipped"
if [ "$mismatched" -gt 0 ]; then
  echo
  echo "!!! $mismatched issue number(s) differ from the BACKLOG.md order (see above): this repo already had"
  echo "    issues or pull requests. Translate the numbers as you go, or seed a fresh copy of the template."
fi
