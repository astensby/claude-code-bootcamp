import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { postJson, startApp, type TestApp } from "./helpers.js";

let app: TestApp;
beforeEach(async () => {
  app = await startApp();
});
afterEach(async () => {
  await app.close();
});

describe("POST /links", () => {
  it("creates a link and returns 201 with a generated slug", async () => {
    const res = await postJson(app.base, "/links", { target_url: "https://example.com/launch" });
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.slug).toMatch(/^[a-z0-9]{6}$/);
    expect(body.target_url).toBe("https://example.com/launch");
    expect(Date.parse(body.created_at)).not.toBeNaN();
  });

  it("returns 400 when target_url is missing", async () => {
    const res = await postJson(app.base, "/links", {});
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/target_url/);
  });

  it("returns 400 when target_url is not an http(s) URL (issue #5)", async () => {
    for (const target_url of ["not a url", "ftp://x"]) {
      const res = await postJson(app.base, "/links", { target_url });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/http\(s\) URL/);
    }
    const ok = await postJson(app.base, "/links", { target_url: "http://example.com/plain-http" });
    expect(ok.status).toBe(201);
  });

  it("returns 400 on a body that is not JSON", async () => {
    const res = await postJson(app.base, "/links", "not json");
    expect(res.status).toBe(400);
  });

  it("returns 413 on a body over 64 KB", async () => {
    const target_url = `https://example.com/${"x".repeat(70_000)}`;
    const res = await postJson(app.base, "/links", { target_url });
    expect(res.status).toBe(413);
    expect((await res.json()).error).toMatch(/at most/);
    expect(app.store.list()).toHaveLength(0);
  });
});

describe("GET /:slug", () => {
  it("redirects with 302 and records the click", async () => {
    const created = await (
      await postJson(app.base, "/links", { target_url: "https://example.com/a" })
    ).json();
    const res = await fetch(`${app.base}/${created.slug}`, {
      redirect: "manual",
      headers: {
        referer: "https://www.linkedin.com/feed/",
        "user-agent": "Mozilla/5.0 (iPhone) Mobile",
      },
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://example.com/a");
    const clicks = app.store.clicks();
    expect(clicks).toHaveLength(1);
    expect(clicks[0]).toMatchObject({
      slug: created.slug,
      referrer: "linkedin.com",
      device: "mobile",
    });
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await fetch(`${app.base}/nope99`, { redirect: "manual" });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/links", () => {
  it("lists links newest first, keeping insertion order for equal timestamps", async () => {
    const link = (slug: string, created_at: string) => ({
      slug,
      target_url: `https://example.com/${slug}`,
      created_at,
    });
    app.store.add(link("older1", "2026-09-01T10:00:00.000Z"));
    app.store.add(link("newer1", "2026-09-02T10:00:00.000Z"));
    app.store.add(link("same_a", "2026-09-01T12:00:00.000Z"));
    app.store.add(link("same_b", "2026-09-01T12:00:00.000Z"));
    const links: any = await (await fetch(`${app.base}/api/links`)).json();
    expect(links.map((l: any) => l.slug)).toEqual(["newer1", "same_a", "same_b", "older1"]);
  });
});

describe("GET /api/stats", () => {
  const seed = () => {
    app.store.add({
      slug: "aaa111",
      target_url: "https://example.com/a",
      created_at: "2026-09-01T00:00:00Z",
    });
    app.store.add({
      slug: "bbb222",
      target_url: "https://example.com/b",
      created_at: "2026-09-01T00:00:00Z",
    });
    const click = (ts: string, slug: string, referrer: string) =>
      app.store.recordClick({ ts, slug, referrer, country: "NO", device: "desktop" });
    click("2026-09-01T09:00:00Z", "aaa111", "linkedin.com");
    click("2026-09-01T10:00:00Z", "aaa111", "google.com");
    click("2026-09-02T09:00:00Z", "aaa111", "linkedin.com");
    click("2026-09-02T09:30:00Z", "bbb222", "direct");
  };

  it("returns totals, top links, clicks by day and by referrer", async () => {
    seed();
    const s = await (await fetch(`${app.base}/api/stats`)).json();
    expect(s.total_clicks).toBe(4);
    expect(s.top_links[0]).toMatchObject({
      slug: "aaa111",
      target_url: "https://example.com/a",
      clicks: 3,
      expired: false,
    });
    expect(s.by_day).toEqual([
      { day: "2026-09-01", clicks: 2 },
      { day: "2026-09-02", clicks: 2 },
    ]);
    expect(s.by_referrer[0]).toEqual({ referrer: "linkedin.com", clicks: 2 });
  });

  it("filters with ?since=", async () => {
    seed();
    const s = await (await fetch(`${app.base}/api/stats?since=2026-09-02T00:00:00Z`)).json();
    expect(s.total_clicks).toBe(2);
    expect(s.by_day).toEqual([{ day: "2026-09-02", clicks: 2 }]);
  });

  it("accepts a date-only since", async () => {
    seed();
    const res = await fetch(`${app.base}/api/stats?since=2026-09-02`);
    expect(res.status).toBe(200);
    expect((await res.json()).total_clicks).toBe(2);
  });

  it("rejects a since that is not a full ISO 8601 date", async () => {
    for (const bad of ["yesterday", "2026", "123", "0", "Sep 2 2026"]) {
      const res = await fetch(`${app.base}/api/stats?since=${encodeURIComponent(bad)}`);
      expect(res.status, `since=${bad}`).toBe(400);
      expect((await res.json()).error).toMatch(/ISO 8601/);
    }
  });
});

describe("expiry", () => {
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  it("creates a link with expires_at and returns it normalised", async () => {
    const res = await postJson(app.base, "/links", {
      target_url: "https://example.com/e",
      expires_at: future,
    });
    expect(res.status).toBe(201);
    expect((await res.json()).expires_at).toBe(future);
  });

  it("rejects an expires_at in the past or not parseable", async () => {
    const past = await postJson(app.base, "/links", {
      target_url: "https://example.com/e",
      expires_at: "2020-01-01T00:00:00Z",
    });
    expect(past.status).toBe(400);
    const junk = await postJson(app.base, "/links", {
      target_url: "https://example.com/e",
      expires_at: "next tuesday",
    });
    expect(junk.status).toBe(400);
  });

  it("returns 410 with an HTML page for an expired link and records no click", async () => {
    app.store.add({
      slug: "old111",
      target_url: "https://example.com/old",
      created_at: "2026-01-01T00:00:00Z",
      expires_at: "2026-02-01T00:00:00Z",
    });
    const res = await fetch(`${app.base}/old111`, { redirect: "manual" });
    expect(res.status).toBe(410);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    expect(await res.text()).toContain("expired");
    expect(app.store.clicks()).toHaveLength(0);
  });

  it("lists expires_at as null when a link has none", async () => {
    await postJson(app.base, "/links", { target_url: "https://example.com/plain" });
    const [link] = await (await fetch(`${app.base}/api/links`)).json();
    expect(link.expires_at).toBeNull();
  });
});

describe("pages", () => {
  it("serves the create page and the list page", async () => {
    for (const path of ["/", "/links"]) {
      const res = await fetch(app.base + path);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toMatch(/text\/html/);
      expect(await res.text()).toContain("<title>linkr");
    }
  });

  it("answers HEAD like GET, without a body", async () => {
    const res = await fetch(`${app.base}/`, { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    expect(await res.text()).toBe("");
  });

  it("redirects on HEAD /:slug without recording a click", async () => {
    const created = await postJson(app.base, "/links", { target_url: "https://example.com/head" });
    const { slug } = await created.json();
    const res = await fetch(`${app.base}/${slug}`, { method: "HEAD", redirect: "manual" });
    expect(res.status).toBe(302);
    const stats = await (await fetch(`${app.base}/api/stats`)).json();
    expect(stats.total_clicks).toBe(0);
  });

  // Placeholder: issue #6 (serve the dashboard at /stats) replaces this test.
  it("has no /stats page", async () => {
    const res = await fetch(`${app.base}/stats`, { redirect: "manual" });
    expect(res.status).toBe(404);
  });
});

describe("routing", () => {
  it("returns 405 with an Allow header for a known path and the wrong method", async () => {
    const put = await fetch(`${app.base}/links`, { method: "PUT" });
    expect(put.status).toBe(405);
    expect(put.headers.get("allow")).toBe("GET, HEAD, POST");
    const post = await fetch(`${app.base}/api/links`, { method: "POST" });
    expect(post.status).toBe(405);
    expect(post.headers.get("allow")).toBe("GET, HEAD");
  });

  it("returns a JSON 404 for an unknown path under /api/", async () => {
    const res = await fetch(`${app.base}/api/nope`);
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ error: "not found" });
  });
});
