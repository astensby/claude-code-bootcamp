# Goal: app/README.md documents only what the server actually reads
End state: every flag or environment variable app/README.md documents is one the server reads, and every one the server reads is documented.
Check: bash toolkit/scripts/check-docs-drift.sh
Bound: 4 turns; only app/README.md may change, never app/src; if the README and the code disagree, the code is the truth.
