#!/usr/bin/env bash
# Preflight for the Claude Code for Developers bootcamp.
# Prints one green/red table. Exits non-zero on any red.
# Run from the repo root: scripts/preflight.sh

cd "$(dirname "$0")/.." || exit 1

GREEN=$'\033[32m'; RED=$'\033[31m'; DIM=$'\033[2m'; RESET=$'\033[0m'
fail=0
row() { # row <ok|fail|manual> <label> <detail>
  case "$1" in
    ok)     printf "  %s✔%s  %-26s %s\n" "$GREEN" "$RESET" "$2" "$3" ;;
    manual) printf "  %s·%s  %-26s %s\n" "$DIM" "$RESET" "$2" "$3" ;;
    *)      printf "  %s✘%s  %-26s %s\n" "$RED" "$RESET" "$2" "$3"; fail=1 ;;
  esac
}

echo
echo "Claude Code for Developers bootcamp — preflight"
echo

# Node >= 22
if command -v node >/dev/null 2>&1; then
  v=$(node --version); major=${v#v}; major=${major%%.*}
  if [ "$major" -ge 22 ] 2>/dev/null; then row ok "node >= 22" "$v"; else row fail "node >= 22" "$v (install Node 22 LTS or newer)"; fi
else row fail "node >= 22" "not found"; fi

# npm
if command -v npm >/dev/null 2>&1; then row ok "npm" "$(npm --version)"; else row fail "npm" "not found"; fi

# git
if command -v git >/dev/null 2>&1; then row ok "git" "$(git --version | awk '{print $3}')"; else row fail "git" "not found"; fi

# Claude Code installed + logged in
if command -v claude >/dev/null 2>&1; then
  cv=$(claude --version 2>/dev/null | head -1)
  row ok "claude" "$cv"
  if claude auth status >/dev/null 2>&1; then
    row ok "claude login" "logged in"
  else
    row fail "claude login" "not logged in — run: claude auth login"
  fi
else row fail "claude" "not found — https://code.claude.com/docs/en/setup"; fi

# gh installed + logged in
gh_ok=0
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then row ok "gh login" "$(gh --version | head -1 | awk '{print $3}'), logged in"; gh_ok=1; else row fail "gh login" "run: gh auth login"; fi
else row fail "gh" "not found — https://cli.github.com"; fi

# gh points at YOUR copy of the repo (not the template, not "which remote?")
if [ "$gh_ok" = 1 ]; then
  info=$(gh repo view --json isTemplate,nameWithOwner -q '.nameWithOwner + " " + (.isTemplate|tostring)' 2>/dev/null || true)
  if [ -z "$info" ]; then row fail "gh repo" "cannot resolve — run: gh repo set-default <you>/claude-code-bootcamp"
  elif [ "${info##* }" = "true" ]; then row fail "gh repo" "${info% *} is the template — work in your own copy (Use this template), then: gh repo set-default <you>/claude-code-bootcamp"
  else row ok "gh repo" "${info% *}"; fi
else row fail "gh repo" "skipped — fix gh first"; fi

# npm ci
if [ -d node_modules ]; then row ok "npm ci" "node_modules present"
else
  echo "  installing dependencies (npm ci)…"
  if npm ci --no-audit --no-fund >/dev/null 2>&1; then row ok "npm ci" "installed"; else row fail "npm ci" "failed — run npm ci and read the error"; fi
fi

# npm test
if npm test --silent >/dev/null 2>&1; then row ok "npm test" "green"; else row fail "npm test" "red — run npm test and read the output"; fi

# Chrome extension: cannot be checked from here
row manual "Chrome extension" "optional; install 'Claude in Chrome' if you want the agent to look at pages"

echo
if [ "$fail" -ne 0 ]; then
  echo "${RED}Something is red.${RESET} Fix it before the day; if you are attending the bootcamp, reply to the invitation email with this whole output and we help."
  exit 1
fi
echo "${GREEN}All green.${RESET} See you on the day."
