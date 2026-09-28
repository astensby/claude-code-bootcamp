/** A sliding-window counter per key (client IP). N hits per window, then 429. */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs = 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  /** Records one hit for `key` and says whether it is within the limit. */
  hit(key: string): { allowed: boolean; retryAfterSec: number } {
    const t = this.now();
    const recent = (this.hits.get(key) ?? []).filter((h) => t - h < this.windowMs);
    if (recent.length >= this.limit) {
      const oldest = recent[0] ?? t;
      this.hits.set(key, recent);
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((oldest + this.windowMs - t) / 1000)),
      };
    }
    recent.push(t);
    this.hits.set(key, recent);
    return { allowed: true, retryAfterSec: 0 };
  }
}

export function limitFromEnv(): number {
  const n = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
}
