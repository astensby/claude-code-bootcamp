import type { IncomingMessage, ServerResponse } from "node:http";
import type { RateLimiter } from "../ratelimit.js";
import type { Click, Link, Store } from "../store.js";
import {
  generateSlug,
  isExpired,
  isValidSlug,
  normalizeSlug,
  validateExpiresAt,
  validateSlug,
  validateTargetUrl,
} from "../validate.js";

/** The largest request body `readJsonBody` buffers; anything bigger is answered with 413. */
export const MAX_BODY_BYTES = 64 * 1024;

/** `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS(.sss)Z`: the two shapes `?since=` accepts. */
const ISO_SINCE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;

export class PayloadTooLargeError extends Error {
  constructor() {
    super(`body must be at most ${MAX_BODY_BYTES} bytes`);
    this.name = "PayloadTooLargeError";
  }
}

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(body));
}

export async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    // Past the cap: stop buffering but keep draining, so the 413 goes out on a fully-read connection.
    if (size <= MAX_BODY_BYTES) chunks.push(chunk as Buffer);
  }
  if (size > MAX_BODY_BYTES) throw new PayloadTooLargeError();
  const text = Buffer.concat(chunks).toString("utf8");
  if (text.trim() === "") return {};
  const parsed: any = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new SyntaxError("body must be a JSON object");
  }
  return parsed as Record<string, unknown>;
}

/** POST /links — create a short link. Rate-limited per client IP; slug user-chosen (lowercased) or generated. */
export async function createLink(
  req: IncomingMessage,
  res: ServerResponse,
  store: Store,
  limiter: RateLimiter,
) {
  let body: any;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    if (err instanceof PayloadTooLargeError) return sendJson(res, 413, { error: err.message });
    return sendJson(res, 400, { error: "body must be valid JSON" });
  }

  const verdict = limiter.hit(req.socket.remoteAddress ?? "unknown");
  if (!verdict.allowed) {
    res.writeHead(429, {
      "content-type": "application/json; charset=utf-8",
      "retry-after": String(verdict.retryAfterSec),
    });
    return res.end(
      JSON.stringify({ error: "too many links created from this address, try again later" }),
    );
  }

  const problem = validateTargetUrl((body as any).target_url) ?? validateSlug(body.slug);
  if (problem) return sendJson(res, 400, { error: problem });

  const expiresProblem = validateExpiresAt(body.expires_at);
  if (expiresProblem) return sendJson(res, 400, { error: expiresProblem });

  let slug: string;
  if (typeof body.slug === "string") {
    slug = normalizeSlug(body.slug);
    if (store.has(slug)) return sendJson(res, 409, { error: `slug is already taken: ${slug}` });
  } else {
    slug = generateSlug();
    while (store.has(slug)) slug = generateSlug();
  }

  const link: Link = {
    slug,
    target_url: String(body.target_url).trim(),
    created_at: new Date().toISOString(),
    expires_at:
      typeof body.expires_at === "string" ? new Date(body.expires_at).toISOString() : null,
  };
  store.add(link);
  return sendJson(res, 201, link);
}

/** GET /api/links — every link, newest first (equal timestamps keep insertion order), always with an expires_at (null when none). */
export function listLinks(_req: IncomingMessage, res: ServerResponse, store: Store) {
  const links = store
    .list()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((l) => ({ ...l, expires_at: l.expires_at ?? null }));
  return sendJson(res, 200, links);
}

interface Stats {
  total_clicks: number;
  top_links: { slug: string; target_url: string; clicks: number; expired: boolean }[];
  by_day: { day: string; clicks: number }[];
  by_referrer: { referrer: string; clicks: number }[];
  by_weekday: { name: string; clicks: number }[];
  by_device: { name: string; clicks: number }[];
  by_country: { name: string; clicks: number }[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function countRows(counts: Map<string, number>) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, clicks]) => ({ name, clicks }));
}

/** GET /api/stats?since=<iso> — aggregate clicks, optionally from a point in time. */
export function stats(_req: IncomingMessage, res: ServerResponse, store: Store, url: URL) {
  const now = Date.now();
  const sinceParam: any = url.searchParams.get("since");
  let since: number | null = null;
  if (sinceParam !== null) {
    since = ISO_SINCE_RE.test(sinceParam) ? Date.parse(sinceParam) : Number.NaN;
    if (Number.isNaN(since)) {
      return sendJson(res, 400, {
        error: "since must be an ISO 8601 date (YYYY-MM-DD) or UTC datetime (YYYY-MM-DDTHH:MM:SSZ)",
      });
    }
  }

  const perSlug = new Map<string, number>();
  const perDay = new Map<string, number>();
  const perReferrer = new Map<string, number>();
  const perWeekday = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
  const perDevice = new Map<string, number>();
  const perCountry = new Map<string, number>();
  let total = 0;

  for (const click of store.clicks()) {
    if (since !== null && Date.parse(click.ts) < since) continue;
    total++;
    perSlug.set(click.slug, (perSlug.get(click.slug) ?? 0) + 1);
    const day = click.ts.slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
    perReferrer.set(click.referrer, (perReferrer.get(click.referrer) ?? 0) + 1);
    perWeekday[(new Date(click.ts).getUTCDay() + 6) % 7]++;
    perDevice.set(click.device, (perDevice.get(click.device) ?? 0) + 1);
    perCountry.set(click.country, (perCountry.get(click.country) ?? 0) + 1);
  }

  const top_links = [...perSlug.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([slug, clicks]) => {
      const link = store.get(slug)!;
      return { slug, target_url: link.target_url, clicks, expired: isExpired(link) };
    });

  const by_day = [...perDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, clicks]) => ({ day, clicks }));

  const by_referrer = [...perReferrer.entries()]
    .sort((a: any, b: any) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([referrer, clicks]) => ({ referrer, clicks }));

  const out: Stats = {
    total_clicks: total,
    top_links,
    by_day,
    by_referrer,
    by_weekday: WEEKDAYS.map((name, i) => ({ name, clicks: perWeekday[i] })),
    by_device: countRows(perDevice),
    by_country: countRows(perCountry),
  };
  return sendJson(res, 200, out);
}
