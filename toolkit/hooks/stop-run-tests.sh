#!/usr/bin/env bash
# stop-run-tests.sh — Stop hook. Runs the tests when the agent wants to stop.
# Red tests → exit 2 with a message on stderr → the agent reads it and keeps working.
# Bounded: after 3 consecutive blocks in one session it lets the stop through, so a test
# the agent cannot fix does not loop forever. The counter lives in
# .tmp/stop-hook-blocks-<session_id> and is removed when the tests pass.
# It runs in the `cwd` from stdin (the worktree when Claude is in one; falls back to
# $CLAUDE_PROJECT_DIR), so it tests the tree Claude is working in.
# It reads stop_hook_active only to report it; it does not act on it (acting on it would
# mean blocking once and never again). Claude Code has its own cap on top: after 8
# consecutive Stop-hook continuations it ends the turn (CLAUDE_CODE_STOP_HOOK_BLOCK_CAP).
#
# Verified against the hooks reference for Claude Code 2.1.284:
#   stdin JSON has session_id, cwd, stop_hook_active (true while a Stop hook is already
#   continuing); exit 2 blocks the stop and shows stderr to the agent;
#   $CLAUDE_PROJECT_DIR stays at the main checkout even inside a worktree.
set -u
input=$(cat)
field() {
  printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{try{const v=JSON.parse(s)[process.argv[1]];process.stdout.write(v==null?"":String(v))}catch{}})' "$1"
}
session=$(field session_id | tr -cd 'A-Za-z0-9._-'); session=${session:-nosession}
cwd=$(field cwd)
active=$(field stop_hook_active); active=${active:-false}

cd "${cwd:-${CLAUDE_PROJECT_DIR:-.}}" 2>/dev/null || cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
COUNT_FILE=".tmp/stop-hook-blocks-$session"
mkdir -p .tmp

if npm test --silent >/dev/null 2>&1; then
  rm -f "$COUNT_FILE"
  exit 0
fi

n=$(( $(cat "$COUNT_FILE" 2>/dev/null || echo 0) + 1 ))
echo "$n" > "$COUNT_FILE"
if [ "$n" -gt 3 ]; then
  echo "tests still red after 3 blocks; letting the stop through — say so in your report" >&2
  rm -f "$COUNT_FILE"
  exit 0
fi
echo "tests red, not done: run 'npm test' in $PWD, fix the failing test, then stop (block $n of 3; stop_hook_active=$active)" >&2
exit 2
