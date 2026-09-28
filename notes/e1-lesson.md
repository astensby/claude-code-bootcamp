Before I trust any per-day number, I check how `ts` is parsed: this export mixes ISO 8601 with `DD/MM/YYYY HH:mm`, and dropping the odd rows silently shifts the daily curve.
