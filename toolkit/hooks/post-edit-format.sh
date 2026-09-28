#!/usr/bin/env bash
# post-edit-format.sh — PostToolUse hook on Edit|Write. Formats the edited file with the
# project's Biome (node_modules/.bin/biome). Reads the tool input from stdin
# (tool_input.file_path). Always exits 0: formatting is hygiene, never a reason to reject
# an edit. No local Biome → does nothing. Never `npx biome`: without a local install that
# resolves to an unrelated npm package named `biome`.
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -x node_modules/.bin/biome ] || exit 0
f=$(node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input.file_path||"")}catch{}})')
[ -n "$f" ] && [ -f "$f" ] || exit 0
case "$f" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.mts|*.json|*.css) node_modules/.bin/biome format --write "$f" >/dev/null 2>&1 ;;
esac
exit 0
