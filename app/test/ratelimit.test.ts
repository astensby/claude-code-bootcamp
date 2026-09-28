import { describe, expect, it } from "vitest";
import { RateLimiter } from "../src/ratelimit.js";

describe("RateLimiter", () => {
  it("allows N hits per window and blocks the next with a retry time", () => {
    let t = 1_000_000;
    const rl = new RateLimiter(3, 60_000, () => t);
    expect(rl.hit("a").allowed).toBe(true);
    expect(rl.hit("a").allowed).toBe(true);
    expect(rl.hit("a").allowed).toBe(true);
    const fourth = rl.hit("a");
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSec).toBe(60);
    t += 61_000;
    expect(rl.hit("a").allowed).toBe(true);
  });

  it("keeps keys apart: another IP is not affected", () => {
    const rl = new RateLimiter(1);
    expect(rl.hit("10.0.0.1").allowed).toBe(true);
    expect(rl.hit("10.0.0.1").allowed).toBe(false);
    expect(rl.hit("10.0.0.2").allowed).toBe(true);
  });
});
