---
name: check
description: Run the app's full check before reporting work done: tests, lint, live endpoints, one page. Use before saying "done", before opening a PR, and whenever asked to verify.
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/check.sh *), Bash(bash ${CLAUDE_SKILL_DIR}/check.sh *), Bash(npm test *), Bash(npm run lint *)
---

# Check

Never report "looks good". Report a table.

## Run

1. Run `${CLAUDE_SKILL_DIR}/check.sh`. It runs `npm test` and `npm run lint`, starts the
   app on a free port with a throwaway store, hits the endpoints, fetches one page, stops the
   app, and prints one row per check with evidence. Exit 0 means every row passed.
2. Add one row the script cannot produce: **coverage of what you just changed**. Name the
   test that covers the edge of the feature you touched (a boundary day, an empty list, a
   duplicate). If no test covers it, the row is FAIL with "no test for <edge>".
3. If any row is FAIL, check whether it matches an open issue (`BACKLOG.md`, or `gh issue list`
   when the repo has issues) and name it in the row; fixing a listed issue is not widening the
   current one. Then fix it or say plainly that you did not, and run the script again.

ADAPT: the endpoints the script hits are the block at the top of `check.sh` (`VALID_URL`, `INVALID_URL`, and the curl calls under "Live endpoints"); change them to what your app actually serves.
ADAPT: the page the script looks at is `PAGE=/links` and `PAGE_MARKER` at the top of `check.sh`; point them at the page a user would open to see the change and a string that proves it rendered. With a browser tool available, open the page and look at the new row itself.

## Output contract

Paste the table as the script prints it, then your coverage row:

| Result | Check | Evidence |
|---|---|---|
| PASS | npm test | exit 0, 15 passed |
| FAIL | POST /links invalid url | expected 400, got 201 |
| ... | ... | ... |

One row per check. Every row has evidence: an exit code, a status code, what the page
showed, a test name. A row without evidence is not a row.

End with one line: `CHECK: PASS` or `CHECK: FAIL (n rows)`.
