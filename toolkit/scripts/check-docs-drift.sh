#!/usr/bin/env bash
# check-docs-drift.sh — documented flags/env vars vs what the server reads. Exit 1 on drift.
#   documented = every --flag outside a "# comment" (comments describe other tools: tsc --noEmit), and
#                every UPPER_CASE name written the way an env var is written (`NAME`, NAME=…, $NAME)
#   real       = every --flag and process.env.NAME the server sources actually reference
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 1
README=app/README.md
SRC=app/src

doc_flags=$(sed 's/#.*$//' "$README" 2>/dev/null | grep -oE -- '--[a-z][a-zA-Z0-9-]*' | sort -u)
doc_envs=$( { grep -oE '`[A-Z][A-Z0-9_]{2,}`' "$README"; grep -oE '(^|[^A-Za-z0-9_])[A-Z][A-Z0-9_]{2,}=' "$README"; grep -oE '\$[A-Z][A-Z0-9_]{2,}' "$README"; } 2>/dev/null \
  | tr -d '`$=' | sed 's/^[^A-Z]*//' | grep -vE '^(HTTP|JSON|CSV|API|URL|GET|POST|HEAD|PUT|PATCH|DELETE|OPTIONS|README|TODO|HTML|ISO|ID|OK)$' | sort -u)
real_flags=$(grep -rhoE -- '--[a-z][a-zA-Z0-9-]*' "$SRC" 2>/dev/null | sort -u)
real_envs=$(grep -rhoE 'process\.env\.[A-Z][A-Z0-9_]*' "$SRC" 2>/dev/null | sed 's/process\.env\.//' | sort -u)

drift=0
for f in $doc_flags; do grep -qx -- "$f" <<<"$real_flags" || { echo "DRIFT: README documents $f but nothing in $SRC reads it"; drift=1; }; done
for e in $doc_envs;  do grep -qx -- "$e" <<<"$real_envs"  || { echo "DRIFT: README documents $e but nothing in $SRC reads process.env.$e"; drift=1; }; done
for e in $real_envs; do grep -qx -- "$e" <<<"$doc_envs"   || { echo "DRIFT: server reads process.env.$e but README does not mention it"; drift=1; }; done

[ $drift -eq 0 ] && echo "docs and server agree"
exit $drift
