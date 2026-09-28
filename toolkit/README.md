# Toolkit

Reference skills, agents, hooks, goals and a loop playbook. Nothing in this folder is
active: Claude Code only loads what sits under `.claude/`. That is deliberate. A skill
under `.claude/skills/` puts its description into every session, so reference material
should cost nothing until you decide to use it. When you want something, copy it in and
adapt it; the commands are at the bottom of this page.

Scripts assume bash, `node`, `curl`, `git` and `lsof` (macOS, Linux or WSL).

## The three shapes of one check

| Shape | What it is | When it is right | Cost |
|---|---|---|---|
| **Skill** | Instructions the agent follows when you invoke it (`/name`) or when its description matches what you asked | A repeatable procedure that needs judgement | Description in context always; body only when used |
| **Hook** | A command that always runs on an event; exit 2 blocks the event with a message the agent reads | A check that must not be skippable | Zero context |
| **Subagent** | An agent definition (markdown with frontmatter) with its own clean context and tool allowlist; returns a result, not a transcript | The checker must not share the writer's context, or work you want to fan out | Isolated; result summarised back |

Same check, three shapes: `/check` is a skill (you decide when), `stop-run-tests` is a
hook (tests run before every stop, no opinion asked), `reviewer` is a subagent (it
runs the check script and reads the diff without your session's assumptions).

## What is here

### `skills/`

- **`check/`** — the app's full check: tests, lint, live endpoints, one page. Most of it
  is `check.sh`, which prints a PASS/FAIL table with one evidence line per row and exits
  non-zero on any FAIL. It starts and stops the app itself; it does not use `run-app`.
  Two lines in `SKILL.md` start with `ADAPT:`; change those when you copy it (E3
  stretch, and the take-home). On `main` it fails on purpose: a malformed URL returns 201
  (issue #5).
  It is named `check` because Claude Code has a bundled `/verify`, which is a different
  tool: it drives the app itself, records what worked into a skill of its own (also named
  `verify`) under `.claude/skills/`, prints no table, and a subagent cannot run it. The
  `reviewer` runs `check.sh` directly, so it works before and after you copy the skill in.
- **`run-app/`** — start the app on a free port, wait for it, print the URL, `stop` it.
  Logs to `.tmp/run-app.log`. For anything that wants to look at a page or hit an endpoint
  by hand; `check.sh` starts its own copy.
- **`add-chart/`** — adds a chart to the single-file dashboard in the pattern it reads
  from the file. A finished version of the E3 fallback skill; write yours first.
- **`handoff/`** — writes a handoff note so the next session or person can continue.
  An example of a personal skill.
- **`dataset-profile/`** — profiles every CSV in a folder: columns, types, empties, and
  values whose shape differs from the column's majority. E1 stretch.
- **`pr-walkthrough/`** — the single-file HTML walkthrough of a PR that E4 asks for, as
  a skill.
- **`reflect/`**, **`groom/`**, **`groom-prep/`**, **`pr-triage/`** — simplified generic
  versions of the skills that make a loop repeatable: learn from the session, decide
  what is ready, draft the specs, sort the merge queue. See `loop/README.md`.

### `agents/`

- **`reviewer.md`** — reviews a diff against the issue's acceptance list, runs the check
  script (`.claude/skills/check/check.sh` if present, else the toolkit copy), returns
  findings by severity with file:line, never edits. An E4 stretch, and step 1 of the E4
  long form.
- **`researcher.md`** — read-only mapper for "where does X happen" questions. Subagents
  are not only reviewers.

`tools:` is listed explicitly in both. Omitting it does not give a minimal set, it
inherits everything. Listing it stops the reviewer inheriting `Edit` and `Write`, but
`Bash` stays, and Bash can `git push`. So the reviewer is read-only **by instruction**
(its prompt says never edit, commit, push or merge), while the researcher, which has no
Bash at all, is read-only **by construction**. To enforce it for the reviewer, add deny
rules to `permissions` in `.claude/settings.json`. They apply to the whole session, main
and every subagent, so keep only the ones the session as a whole should live with (a
worker that commits and opens PRs cannot run under `Bash(git commit *)`):

```json
{
  "permissions": {
    "deny": ["Bash(git push *)", "Bash(git commit *)", "Bash(gh pr merge *)"]
  }
}
```

A specifier such as `Bash(git push *)` inside the agent's own `tools:` or
`disallowedTools:` does not do this: there it removes the whole tool.

### `hooks/`

JSON fragments that merge into `.claude/settings.json` under the top-level `"hooks"` key.
If `settings.json` already has a `"hooks"` object, add the event array inside it; if the
event already exists, append to its array.

- **`stop-run-tests.json`** — `Stop`: runs `npm test`; on red it exits 2 with
  "tests red, not done", so the agent keeps working instead of reporting done. The
  instructor's hook demo in block 3, and an E3 stretch.
  The command is `stop-run-tests.sh`. It runs the tests in the `cwd` from stdin, so in a
  worktree it tests the worktree, and it bounds itself with a counter in
  `.tmp/stop-hook-blocks-<session_id>`: after three blocks it lets the stop through, so a
  test the agent cannot fix does not loop forever. It reads `stop_hook_active` only to
  report it; it does not act on it (acting on it would mean blocking once and never again).
  Claude Code has its own cap on top: after eight consecutive Stop-hook continuations it
  ends the turn regardless (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` raises it).
- **`post-edit-format.json`** — `PostToolUse` on `Edit|Write`: formats the edited file
  with the project's Biome (`node_modules/.bin/biome`; does nothing if it is not
  installed). Zero-context hygiene.
- **`notify-done.json`** — `Stop`: a macOS notification when a turn ends, so you can look
  away during E4. Linux: swap `osascript` for `notify-send`.

**The contract (verified against the hooks reference, Claude Code 2.1.284):** the hook
gets JSON on stdin (`session_id`, `hook_event_name`, `cwd`, `tool_input` for tool events,
`stop_hook_active` for `Stop`) and `$CLAUDE_PROJECT_DIR` in its environment. `cwd`
follows Claude into a worktree; `$CLAUDE_PROJECT_DIR` stays at the main checkout. Exit 0 =
fine, continue. Exit 2 = block; whatever the hook wrote to stderr is shown to the agent as
the reason. Any other exit code = a non-blocking error, logged, the action proceeds.
`Stop` on exit 2 keeps the agent working; `PostToolUse` on exit 2 shows stderr to the
agent, but the edit already happened; `PreToolUse` on exit 2 blocks the call.

### `goals/`

`TEMPLATE.md` and three filled examples. A goal is three lines the evaluator can act on:
**End state** (observable), **Check** (a command whose exit code decides), **Bound** (turns,
time, files, what it must not do). `lint-debt.md` uses
`npx biome lint . --error-on-warnings` and is the E5 demo goal; `docs-drift.md` and
`endpoint-tests.md` use the scripts in `toolkit/scripts/` (`endpoint-tests.md` is green on `main`
today; it is the goal to run after a PR adds a route).

### `loop/`

`loop.md` is a per-repo playbook template: WIP cap, gates, evidence rules, how to author a
goal, and the six-step cadence. `README.md` says the same in plain words and names the
two steps that stay human.

### `scripts/`

- **`check-docs-drift.sh`** — documented flags vs what the server reads. Exit 1 on drift.
- **`check-endpoint-tests.sh`** — every route has a test that names it. Exit 1 otherwise.

### `ideas/`

`personal-skill-ideas.md`: twenty one-liners if you would rather write a personal skill
than `add-chart` in E3.

## How to copy

```
cp -r toolkit/skills/check .claude/skills/          # then edit the two ADAPT: lines
cp toolkit/agents/reviewer.md .claude/agents/
cat toolkit/hooks/stop-run-tests.json                # merge into .claude/settings.json
cp toolkit/goals/lint-debt.md goals/                 # the E5 demo goal, ready to run
cp toolkit/goals/TEMPLATE.md goals/<name>.md         # your own: then fill the three lines
```

Skills and agents under `.claude/` are picked up live within the session; no restart.
`/skills` shows what loaded. `/reload-skills` is only for a `.claude/skills/` directory
that did not exist when the session started; this repo ships both `.claude/skills/` and
`.claude/agents/` (empty), so that does not apply here.
