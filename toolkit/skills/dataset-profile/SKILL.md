---
name: dataset-profile
description: Profile every CSV in a folder — columns, inferred types, empties, and values whose shape differs from the column's majority. Use before building anything on a dataset you have not read.
argument-hint: [folder]
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/profile.mjs *)
---

# Dataset profile

Run `node ${CLAUDE_SKILL_DIR}/profile.mjs $ARGUMENTS`. With no argument the script
profiles `data/`; a folder that does not exist is one clear line and exit 1.

For each CSV it prints: rows, columns, and per column the inferred type, the number of
empty values, the number of distinct values, and the **shape report**: the dominant shape
of the values (digits as `9`, letters as `a`) and every minority shape with its share and
an example. A column that is 97% `9999` and 3% `a-9999` is a postcode column with two
formats, and the 3% is exactly what you would otherwise have assumed away.

Report back the table as printed, then one line per column whose minority shapes look
like a second format rather than noise. Say what you would do about each before using
the column.
