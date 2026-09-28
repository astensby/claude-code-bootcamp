import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface Link {
  slug: string;
  target_url: string;
  created_at: string;
  owner?: string;
  campaign_id?: string;
  /** ISO 8601; null or absent means the link never expires. */
  expires_at?: string | null;
}

export interface Click {
  ts: string;
  slug: string;
  referrer: string;
  country: string;
  device: string;
}

interface StoreData {
  links: Link[];
  clicks: Click[];
}

/** Where the store lives. One file per environment: point LINKR_STORE somewhere else for tests. */
export function storePath(): string {
  return process.env.LINKR_STORE ?? ".data/store.json";
}

/** Read and parse the store file, or throw an error that names the file and says how to recover. */
function loadStoreFile(file: string): unknown {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw cannotLoad(file, err instanceof Error ? err.message : String(err));
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw cannotLoad(file, "expected a JSON object with links and clicks");
  }
  return parsed;
}

function cannotLoad(file: string, reason: string): Error {
  const hint = "delete .data/store.json (or the file LINKR_STORE points at) and re-run `npm run seed`";
  return new Error(`cannot load linkr store file ${file}: ${reason}; ${hint}`);
}

/**
 * A JSON-file store. Everything is held in memory and written back on every change.
 * Good enough for a small app; not a database.
 */
export class Store {
  private data: StoreData = { links: [], clicks: [] };
  private readonly bySlug = new Map<string, Link>();

  constructor(private readonly file: string) {
    if (existsSync(file)) {
      const raw = loadStoreFile(file) as Partial<StoreData>;
      this.data = { links: raw.links ?? [], clicks: raw.clicks ?? [] };
      for (const link of this.data.links) this.bySlug.set(link.slug, link);
    }
  }

  static open(file = storePath()): Store {
    return new Store(file);
  }

  get(slug: string): Link | undefined {
    return this.bySlug.get(slug);
  }

  has(slug: string): boolean {
    return this.bySlug.has(slug);
  }

  list(): Link[] {
    return [...this.data.links];
  }

  add(link: Link): Link {
    if (this.bySlug.has(link.slug)) throw new Error(`slug already exists: ${link.slug}`);
    this.data.links.push(link);
    this.bySlug.set(link.slug, link);
    this.flush();
    return link;
  }

  recordClick(click: Click): void {
    this.data.clicks.push(click);
    this.flush();
  }

  clicks(): Click[] {
    return this.data.clicks;
  }

  /** Replace everything at once (used by `npm run seed`). */
  replaceAll(links: Link[], clicks: Click[]): void {
    this.data = { links: [...links], clicks: [...clicks] };
    this.bySlug.clear();
    for (const link of links) this.bySlug.set(link.slug, link);
    this.flush();
  }

  /** Write to a sibling `.tmp` file and rename it over the store, so a crash mid-write never leaves a half file. */
  private flush(): void {
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data));
    renameSync(tmp, this.file);
  }
}
