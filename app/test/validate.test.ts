import { describe, expect, it } from "vitest";
import {
  generateSlug,
  isExpired,
  isValidSlug,
  validateExpiresAt,
  validateTargetUrl,
} from "../src/validate.js";

describe("slugs", () => {
  it("accepts letters, digits, dash and underscore between 3 and 32 chars", () => {
    expect(isValidSlug("abc")).toBe(true);
    expect(isValidSlug("summer-sale_2026")).toBe(true);
    expect(isValidSlug("a".repeat(32))).toBe(true);
  });

  it("rejects too short, too long and unsafe characters", () => {
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("a".repeat(33))).toBe(false);
    expect(isValidSlug("has space")).toBe(false);
    expect(isValidSlug("path/like")).toBe(false);
  });

  it("generates six readable characters, deterministically for a given random source", () => {
    let i = 0;
    const seq = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
    const slug = generateSlug(() => seq[i++ % seq.length]);
    expect(slug).toHaveLength(6);
    expect(isValidSlug(slug)).toBe(true);
    expect(slug).not.toMatch(/[01ol]/);
  });
});

describe("expires_at", () => {
  const now = Date.parse("2026-09-01T12:00:00Z");

  it("accepts absent, null, or a future ISO date", () => {
    expect(validateExpiresAt(undefined, now)).toBeNull();
    expect(validateExpiresAt(null, now)).toBeNull();
    expect(validateExpiresAt("2026-09-02T12:00:00Z", now)).toBeNull();
  });

  it("rejects the past and non-dates", () => {
    expect(validateExpiresAt("2026-08-31T12:00:00Z", now)).toMatch(/future/);
    expect(validateExpiresAt("soon", now)).toMatch(/ISO 8601/);
    expect(validateExpiresAt(42, now)).toMatch(/ISO 8601/);
  });

  it("knows an expired link from a live one", () => {
    expect(isExpired({ expires_at: "2026-08-31T12:00:00Z" }, now)).toBe(true);
    expect(isExpired({ expires_at: "2026-09-02T12:00:00Z" }, now)).toBe(false);
    expect(isExpired({ expires_at: null }, now)).toBe(false);
  });
});

describe("target_url", () => {
  it("accepts an http(s) URL", () => {
    expect(validateTargetUrl("https://example.com/path?q=1")).toBeNull();
  });

  it("requires a non-empty string", () => {
    expect(validateTargetUrl(undefined)).toMatch(/required/);
    expect(validateTargetUrl("")).toMatch(/required/);
    expect(validateTargetUrl(42)).toMatch(/required/);
  });
});
