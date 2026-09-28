import { existsSync, writeFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { Store } from "../src/store.js";
import { removeTempStores, tempStoreFile } from "./helpers.js";

afterAll(removeTempStores);

const link = (slug: string) => ({
  slug,
  target_url: `https://example.com/${slug}`,
  created_at: "2026-09-01T10:00:00.000Z",
});

describe("Store", () => {
  it("adds, gets and lists links", () => {
    const store = new Store(tempStoreFile());
    store.add(link("abc123"));
    store.add(link("def456"));
    expect(store.get("abc123")?.target_url).toBe("https://example.com/abc123");
    expect(store.list().map((l) => l.slug)).toEqual(["abc123", "def456"]);
  });

  it("refuses a duplicate slug", () => {
    const store = new Store(tempStoreFile());
    store.add(link("abc123"));
    expect(() => store.add(link("abc123"))).toThrow(/already exists/);
  });

  it("persists to disk and reloads, leaving no .tmp file behind", () => {
    const file = tempStoreFile();
    const a = new Store(file);
    a.add(link("abc123"));
    a.recordClick({
      ts: "2026-09-01T11:00:00.000Z",
      slug: "abc123",
      referrer: "direct",
      country: "NO",
      device: "desktop",
    });
    expect(existsSync(`${file}.tmp`)).toBe(false);
    const b = new Store(file);
    expect(b.get("abc123")).toBeDefined();
    expect(b.clicks()).toHaveLength(1);
  });

  it("replaceAll swaps the whole data set", () => {
    const store = new Store(tempStoreFile());
    store.add(link("old000"));
    store.replaceAll([link("new000")], []);
    expect(store.has("old000")).toBe(false);
    expect(store.has("new000")).toBe(true);
  });

  it("refuses a corrupt file with an error that names it and says how to recover", () => {
    const file = tempStoreFile();
    writeFileSync(file, "{ this is not json");
    expect(() => new Store(file)).toThrow(file);
    expect(() => new Store(file)).toThrow(/delete \.data\/store\.json .*npm run seed/);
    writeFileSync(file, "42");
    expect(() => new Store(file)).toThrow(/npm run seed/);
  });
});
