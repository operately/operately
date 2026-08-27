const COMPANY_NAME_MAX_LENGTH = 24;

/**
 * Keeps the company name from crowding the navbar. Truncated names end in an
 * ellipsis and stay within COMPANY_NAME_MAX_LENGTH Unicode code points overall,
 * so emoji and other multi-unit characters are not split mid-glyph.
 */
export function truncateCompanyName(name: string, maxLength = COMPANY_NAME_MAX_LENGTH): string {
  const characters = Array.from(name);

  if (characters.length <= maxLength) return name;

  return `${characters.slice(0, maxLength - 1).join("")}…`;
}
