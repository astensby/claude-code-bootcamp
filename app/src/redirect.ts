import type { IncomingMessage, ServerResponse } from "node:http";
import type { Store } from "./store.js";
import { isValidSlug, SLUG_RE } from "./validate.js";

function deviceOf(userAgent: any): string {
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

  const link = store.get(slug);
  if (!link) return notFound(res);

  const referer: any = req.headers.referer;
  if (req.method !== "HEAD") {
    store.recordClick({
      ts: new Date().toISOString(),
      slug: link.slug,
      referrer: referrerOf(referer),
      country: String(req.headers["x-country"] ?? "unknown"),
      device: deviceOf(String(req.headers["user-agent"] ?? "")),
    });
  }

  res.writeHead(302, { location: store.get(slug)!.target_url });
  res.end();
}

function notFound(res: ServerResponse) {
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("No such link\n");
}
