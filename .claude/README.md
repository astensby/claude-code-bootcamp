# .claude/

What is here to start with, and why it is this small.

## settings.json

A permissions allowlist and nothing else. Each rule lets the agent run one command family without asking:

| Rule | Lets it run |
|---|---|
| `Bash(npm test *)` | the test suite, with any flags |
| `Bash(npm run lint *)` | the linter |
| `Bash(npm run dev *)` | the dev server |
| `Bash(npm ci)` | a clean install, exactly that command |
| `Bash(gh pr view *)`, `Bash(gh pr list *)` | read pull requests |
| `Bash(gh issue list *)`, `Bash(gh issue view *)`, `Bash(gh issue create *)` | list, read and create issues; not close, edit or delete them |
| `Bash(git status *)`, `Bash(git diff *)`, `Bash(git log *)` | read git state |

The trailing ` *` is a prefix match; `Bash(npm ci)` without it matches that exact command only. Rules are checked deny → ask → allow, so a deny always wins. The only writes here are `npm ci` (installs from the lockfile) and `gh issue create`; nothing pushes, merges or deletes.

No hooks, no `env`, no model pin. The first hook (`toolkit/hooks/stop-run-tests.json`, the instructor's block 3 demo and an E3 stretch) goes next to `permissions` in this file. Anything the agent asks for during the day that you want to keep goes in `.claude/settings.local.json` (gitignored by Claude Code) or here.

## skills/ · agents/ · rules/

Empty on purpose. Anything under `.claude/skills/` loads its description into every session, so reference material lives in `toolkit/` instead and costs nothing until you copy it in.

- `skills/`: E3 fills it (your own skill; `check` as a stretch)
- `agents/`: E4 fills it (`reviewer`; a stretch in the short form, step 1 of the long form)
- `rules/`: E2b stretch (`api.md` scoped with `paths:`)

There is no `CLAUDE.md` yet. You write it in E2b with `/init` and prune it line by line.
