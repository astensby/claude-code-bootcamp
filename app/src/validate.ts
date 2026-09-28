/** Slugs: 3–32 characters, letters, digits, dash, underscore. */
export const SLUG_RE = /^[A-Za-z0-9_-]{3,32}$/;

const RESERVED = ["api", "links", "stats"];
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o/1/l: easy to confuse when read aloud or typed

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/** Slugs are case-insensitive: stored and looked up in lowercase. */
export function normalizeSlug(slug: string): string {
  return slug.toLowerCase();
}

/** Validates a user-chosen slug. Absent is fine: one will be generated. */
export function validateSlug(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || !isValidSlug(value)) {
    return "slug must be 3–32 characters: letters, digits, - or _";
  }
  if (RESERVED.includes(normalizeSlug(value))) return `slug is reserved: ${value}`;
  return null;
}

/** Returns an error message, or null when the value is acceptable. */
export function validateTargetUrl(value: unknown): string | null {
  if (typeof value !== "string") return "target_url is required";
  if (value.trim() === "") return "target_url is required";
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return "target_url must be an absolute http(s) URL";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "target_url must be an absolute http(s) URL";
  }
  return null;
}

/** Returns an error message, or null. Absent or null is fine: the link never expires. */
export function validateExpiresAt(value: unknown, now: number = Date.now()): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return "expires_at must be an ISO 8601 date";
  const t = Date.parse(value);
  if (Number.isNaN(t)) return "expires_at must be an ISO 8601 date";
  if (t <= now) return "expires_at must be in the future";
  return null;
}

export function isExpired(link: { expires_at?: string | null }, now: number = Date.now()): boolean {
  return typeof link.expires_at === "string" && Date.parse(link.expires_at) <= now;
}

export function generateSlug(random: () => number = Math.random, length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET.charAt(Math.floor(random() * ALPHABET.length));
  }
  return out;
}
