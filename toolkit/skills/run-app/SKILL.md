---
name: run-app
description: Start the app on a free port and print its URL, or stop it. Use before looking at a page, hitting an endpoint by hand, or when asked to run the app.
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/run-app.sh *)
argument-hint: [start|stop|status]
---

# Run app

Scripts beat prose. Run `${CLAUDE_SKILL_DIR}/run-app.sh $ARGUMENTS`.

- `start [port]` picks a free port unless given one, starts `npm run dev` in the
  background, waits until `/` answers, prints `http://localhost:<port>`. The pid and port
  go to `.tmp/run-app.pid` and `.tmp/run-app.port`; the app's output goes to
  `.tmp/run-app.log` (read it when a request does something odd).
- `stop` stops what `start` launched.
- `status` prints the URL if it is up.

Always `stop` before you finish, unless the user asked to keep it running. Report the URL
and nothing else.
