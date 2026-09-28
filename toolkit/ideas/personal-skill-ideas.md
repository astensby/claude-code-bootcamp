# Twenty personal skills, one line each

Pick one you re-do by hand at work. Write only its `description:` line first; the body
comes from the first time you run it and it gets something wrong.

1. **pr-description** — write the PR body from the diff and the issue: what changed, how it was verified, what to look at.
2. **changelog-entry** — one user-facing line per merged PR since the last tag, in the changelog's existing voice.
3. **migration-checklist** — for a schema change: backfill, rollback, index, downtime, the order to ship in.
4. **log-triage** — group a log file by error signature, count, first and last seen, one probable cause each.
5. **flaky-test-hunt** — run the suite N times, list tests that failed inconsistently, propose the cause per test.
6. **dep-bump-review** — for a dependency bump: changelog between versions, breaking changes that touch our imports, what to test.
7. **onboarding-doc** — a "start here" page for a folder: what it owns, entry points, how to run and test it.
8. **handoff** — a session handoff note (there is one in this toolkit).
9. **issue-from-error** — turn a pasted stack trace into an issue with title, repro, expected, actual, first suspect.
10. **endpoint-doc** — document one route from its handler and test: method, path, params, responses, example curl.
11. **test-from-bug** — write the failing test that reproduces a reported bug before touching the fix.
12. **review-checklist** — run our team's review checklist over a diff and answer each item with file:line.
13. **release-notes** — group merged PRs since the last tag by user-visible theme, in the product's voice.
14. **query-explain** — explain a slow SQL query's plan and propose the index or rewrite.
15. **config-diff** — diff two environment configs and flag every key that exists in only one.
16. **meeting-to-issues** — turn meeting notes into issues with acceptance lists, one per decision.
17. **dead-code-scan** — list exports with zero references and the PR that last touched each.
18. **api-contract-check** — compare the OpenAPI file with the routes actually registered.
19. **incident-timeline** — from logs and chat, a timeline with detection, mitigation, root cause, follow-ups.
20. **daily-standup** — from `git log --since=yesterday` and open PRs: done, doing, blocked, three lines.
