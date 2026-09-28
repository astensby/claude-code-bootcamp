import type { IncomingMessage, ServerResponse } from "node:http";
import type { Store } from "./store.js";
import { isExpired, isValidSlug, normalizeSlug } from "./validate.js";

function deviceOf(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return "mobile";
  return "desktop";
}

function referrerOf(referer: string | undefined): string {
  if (!referer) return "direct";
  try {
    return new URL(referer).hostname.replace(/^www\./, "");
  } catch {
    return "direct";
  }
}

/** GET /:slug — record the click and send the visitor on. HEAD redirects without counting. */
export function redirect(req: IncomingMessage, res: ServerResponse, store: Store, slug: string) {
  if (!isValidSlug(slug)) return notFound(res);

  const link = store.get(normalizeSlug(slug));
  if (!link) return notFound(res);
  if (isExpired(link)) return gone(res);

  const referer = req.headers.referer;
  if (req.method !== "HEAD") {
    store.recordClick({
      ts: new Date().toISOString(),
      slug: link.slug,
      referrer: referrerOf(referer),
      country: String(req.headers["x-country"] ?? "unknown"),
      device: deviceOf(String(req.headers["user-agent"] ?? "")),
    });
  }

  res.writeHead(302, { location: link.target_url });
  res.end();
}

/** 410 for a person mid-redirect: a page, not JSON, and no click counted. */
function gone(res: ServerResponse) {
  res.writeHead(410, { "content-type": "text/html; charset=utf-8" });
  res.end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Link expired</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem}</style></head>
<body><h1>This link has expired</h1><p>The short link you followed is no longer active. Ask whoever shared it for a fresh one.</p></body></html>
`);
}

function notFound(res: ServerResponse) {
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("No such link\n");
}
