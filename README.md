# Claude Code for Developers · bootcamp repository

This is the repository for the Claude Code for Developers bootcamp. It holds the exercises for the day, a small app to practise on with its data and a backlog of issues, and a toolkit of reference skills, agents, hooks and goals you can copy into your own projects.

By the end of the day you will have, in a repo of your own: a `CLAUDE.md` you pruned line by line, a skill you wrote, a reviewer agent you read findings from, a written workflow for running and reviewing agent work, and one goal that runs without you.

Bring your own data and, if you have one, a repo of your own. Every exercise works on yours first. This repo is what you use when you have nothing to bring: a click export in `data/`, the `linkr` app with issues to fix, and the toolkit.

**New here? Open the companion guide**, [docs/index.html](docs/index.html), in a browser, or read it online at https://astensby.github.io/claude-code-bootcamp/. It walks through the setup, the day, every exercise, the app, the backlog and the toolkit, with a copy button on every command.

## Setup before the day

One click and five commands.

1. On https://github.com/astensby/claude-code-bootcamp click **Use this template** and create `<you>/claude-code-bootcamp`. Private is fine.
2. `git clone https://github.com/<you>/claude-code-bootcamp && cd claude-code-bootcamp`
3. `git remote add upstream https://github.com/astensby/claude-code-bootcamp && git fetch upstream --tags`
   Templates copy files only. The tags and the `solutions` branch come from upstream, which is public.
4. `gh repo set-default <you>/claude-code-bootcamp`
   Otherwise `gh` picks `upstream`, and your issues and PRs would land in the template repo.
5. `npm ci`
6. `scripts/preflight.sh` prints one green/red table. Fix anything red before the day; if you are attending the bootcamp, reply to the invitation email with the output and we help.

You need Node 22 or newer, git, `gh` logged in, and Claude Code logged in. The Chrome extension is optional.

On the day, before E2a, run `scripts/seed-issues.sh`. It creates the eight issues from `BACKLOG.md` in your repo, plus eight labels: `ex2` to `ex5` for the exercises and `ready`, `needs-spec`, `loop-review` for the loop. Templates do not copy issues. The script stops when `gh` cannot tell which repo is yours, and it refuses to seed the template itself; step 4 is what points it at your copy.

## The day

Four blocks, five exercises, one demo, one take-home.

| Block | Exercise | What you leave with |
|---|---|---|
| 1 · 09:00–10:00 | [E1 · Data to interactive dashboard](exercises/01-dashboard.md) · 15 min | `dashboard/index.html` |
| 2 · 10:00–12:00 | [E2a · Plan and brainstorm](exercises/02a-plan-brainstorm.md) · 15 min | `SPEC.md`, `options.html` |
| | [E2b · CLAUDE.md](exercises/02b-claude-md.md) · 10 min | `CLAUDE.md`, the feature built |
| 3 · 12:30–14:00 | [E3 · Build your own skill](exercises/03-your-skill.md) · 15 min | `.claude/skills/<yours>/` |
| 4 · 14:00–15:30 | [E4 · Two in parallel, one reviewer](exercises/04-two-in-parallel.md) · 20 min, or the [long form](exercises/04-long-form.md) · 45 min | two PRs, a walkthrough in `reviews/` (gitignored, stays on your machine), a merge |
| | [E5 · A goal that runs without you](exercises/05-take-home.md) · 10 min demo | the instructor runs it on this repo; you watch |
| take-home | [E5 · One loop by Friday](exercises/05-take-home.md) | `goals/<name>.md`, `loop.md`, `REFLECTION.md`, in a repo of your own |

Every exercise doc has the same shape: what we will do, the steps with prompts you can paste, what done looks like, stretch goals, a two-minute question we answer together afterwards, and a way to catch up if you fall behind. [exercises/00-format.md](exercises/00-format.md) explains it on one page.

## The app

`linkr` is a small link shortener with click stats: an API, two pages, and a click export in `data/`. It is here to practise on. It ships with three known bugs, listed as issues #5, #7 and #8 in `BACKLOG.md`.

```
npm run seed       # load data/*.csv into the store so /api/stats matches data/
npm run dev        # http://localhost:3000  (PORT env to change)
npm test           # vitest, 27 tests, under 5 s
npm run lint       # biome; warnings are expected on main
npm run typecheck  # tsc, no emit; CI runs it too
```

The server reads the store once at start: seed first, or restart it after seeding.

Pages: `/` (create a link), `/links` (list). API: `POST /links`, `GET /:slug` (302), `GET /api/links`, `GET /api/stats?since=`. Details in [app/README.md](app/README.md). The store is a JSON file at `.data/store.json` (`LINKR_STORE` to change).

## Stuck?

Every exercise's finished state is a tag on upstream's `solutions` branch: `ex2-start`, `ex3-start`, `ex4-start`, `ex5-start` and `ex5-done`. Take only the paths the exercise's Stuck? section names; checking out more replaces your own work with the solution's.

```
git fetch upstream --tags
git checkout ex3-start -- SPEC.md CLAUDE.md app
```

## Layout

```
docs/          index.html, the companion guide: open it in a browser
exercises/     the exercises: 01, 02a, 02b, 03, 04 (+ long form), 05 take-home, and 00-format.md
data/          clicks.csv · links.csv · campaigns.csv · alt/ (SSB, brreg)
app/           src/ · test/ · README.md
dashboard/     empty; E1 writes index.html here, served at /stats if you take issue #6
goals/         empty; the E5 demo and the take-home write goals here
BACKLOG.md     the 8 issues; scripts/seed-issues.sh creates them in your repo
toolkit/       reference skills, agents, hooks, goals and the loop playbook: copy, then adapt
scripts/       preflight.sh · seed-issues.sh · seed.ts
.claude/       settings.json (permissions only) · README.md · skills/ agents/ rules/ (empty)
```

There is no `CLAUDE.md` yet: you write it in E2b with `/init` and prune it line by line. `toolkit/` sits outside `.claude/` so it costs no context until you copy something in.

## Licence

MIT. See [LICENSE](LICENSE).
