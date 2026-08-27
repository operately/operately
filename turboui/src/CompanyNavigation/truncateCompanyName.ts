const COMPANY_NAME_MAX_LENGTH = 24;

function splitGraphemes(text: string): string[] | null {
  const Segmenter = typeof Intl !== "undefined" ? Intl.Segmenter : undefined;

  if (typeof Segmenter !== "function") return null;

  const segmenter = new Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(text), (segment) => segment.segment);
}

/**
 * Keeps the company name from crowding the navbar. Truncated names end in an
 * ellipsis and stay within COMPANY_NAME_MAX_LENGTH graphemes overall, so flags,
 * combining marks, and ZWJ emoji are not split mid-glyph.
 */
export function truncateCompanyName(name: string, maxLength = COMPANY_NAME_MAX_LENGTH): string {
  const graphemes = splitGraphemes(name);

  if (!graphemes) return name;
  if (graphemes.length <= maxLength) return name;

  return `${graphemes.slice(0, maxLength - 1).join("")}…`;
}
