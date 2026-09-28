import { describe, expect, it } from "vitest";
import { generateSlug, isValidSlug, validateTargetUrl } from "../src/validate.js";

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
