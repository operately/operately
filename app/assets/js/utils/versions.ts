interface ReleaseLike {
  id?: string | null;
  title?: string | null;
  teaser?: string | null;
}

interface AvailableUpdate {
  version: string;
}

const SEMVER_IN_TEXT = /\bv?(\d+\.\d+(?:\.\d+)?)\b/i;
const PLAIN_GUID = /^v?\d+\.\d+(?:\.\d+)?$/i;
/** Release page slugs are always `v` + major + minor + patch, e.g. v180 → 1.8.0 */
const RELEASE_URL_SLUG = /(?:^|\/)v(\d)(\d)(\d)\/?$/i;

/**
 * Extract a comparable/display version from a product release.
 * Prefers the stable URL slug (`…/v180` → `v1.8.0`), then a plain guid,
 * then a semver found in title/teaser.
 */
export function extractReleaseVersion(release: ReleaseLike | null | undefined): string | null {
  if (!release) return null;

  const id = release.id?.trim();
  if (id) {
    const fromUrl = matchReleaseUrlSlug(id);
    if (fromUrl) return formatDisplayVersion(fromUrl);

    if (PLAIN_GUID.test(id) && !id.includes("/")) {
      return formatDisplayVersion(id.replace(/^v/i, ""));
    }
  }

  for (const text of [release.title, release.teaser]) {
    const fromText = matchSemver(text);
    if (fromText) return formatDisplayVersion(fromText);
  }

  return null;
}

export function parseVersion(version: string | null | undefined): number[] | null {
  if (!version) return null;

  const match = version.trim().match(/^v?(\d+(?:\.\d+)*)/i);
  const captured = match?.[1];
  if (!captured) return null;

  const parts = captured.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;

  return parts;
}

/** Returns negative if a < b, 0 if equal, positive if a > b. */
export function compareVersions(a: string, b: string): number | null {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) return null;

  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i++) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    if (l !== r) return l - r;
  }

  return 0;
}

export function toAvailableUpdate(
  release: ReleaseLike | null | undefined,
  currentReleaseVersion: string | null | undefined,
): AvailableUpdate | null {
  const latest = extractReleaseVersion(release);
  if (!latest || !currentReleaseVersion) return null;

  const cmp = compareVersions(latest, currentReleaseVersion);
  if (cmp === null || cmp <= 0) return null;

  return { version: latest };
}

function matchReleaseUrlSlug(id: string): string | null {
  const match = id.match(RELEASE_URL_SLUG);
  if (!match?.[1] || !match[2] || !match[3]) return null;

  return `${match[1]}.${match[2]}.${match[3]}`;
}

function matchSemver(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(SEMVER_IN_TEXT);
  return match?.[1] ?? null;
}

function formatDisplayVersion(bare: string): string {
  return bare.startsWith("v") || bare.startsWith("V") ? bare : `v${bare}`;
}
