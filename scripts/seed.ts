/**
 * Load data/links.csv and data/clicks.csv into the JSON store, so /api/stats
 * returns the same numbers the E1 dashboard was built from.
 *
 *   npm run seed                      # → .data/store.json (or LINKR_STORE)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { type Click, type Link, Store, storePath } from "../app/src/store.js";

const DATA = fileURLToPath(new URL("../data", import.meta.url));

function readCsv(file: string): Record<string, string>[] {
  const [header, ...lines] = readFileSync(join(DATA, file), "utf8").trim().split("\n");
  const cols = header.split(",");
  return lines.map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? ""]));
  });
}

/** Normalise a click timestamp to ISO 8601 UTC. */
function toIso(ts: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(ts);
  if (m) {
    const [, dd, mm, yyyy, hh, mi] = m;
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00Z`;
  }
  const t = Date.parse(ts);
  if (Number.isNaN(t)) throw new Error(`unparseable timestamp: ${ts}`);
  return new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z");
}

const links: Link[] = readCsv("links.csv").map((r) => ({
  slug: r.slug,
  target_url: r.target_url,
  created_at: r.created_at,
  ...(r.owner ? { owner: r.owner } : {}),
  ...(r.campaign_id ? { campaign_id: r.campaign_id } : {}),
}));

const clicks: Click[] = readCsv("clicks.csv").map((r) => ({
  ts: toIso(r.ts),
  slug: r.slug,
  referrer: r.referrer,
  country: r.country,
  device: r.device,
}));

const file = storePath();
Store.open(file).replaceAll(links, clicks);
console.log(
  `Seeded ${links.length} links and ${clicks.length} clicks into ${file}. If npm run dev is already running, restart it to pick this up.`,
);
