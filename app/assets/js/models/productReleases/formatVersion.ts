/**
 * Marketing release ids look like `https://operately.com/releases/v180`.
 * That slug encodes major.minor.patch without dots (`180` → `1.8.0`).
 * Display omits a trailing `.0` patch (`v1.8`).
 */
export function formatProductReleaseVersion(id: string | null | undefined): string | null {
  if (!id) return null;

  const digits = id.match(/\/v(\d+)$/i)?.[1];
  if (!digits || digits.length !== 3) return null;

  const [major, minor, patch] = digits;

  return patch === "0" ? `v${major}.${minor}` : `v${major}.${minor}.${patch}`;
}
