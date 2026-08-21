const COMPANY_NAME_MAX_LENGTH = 24;

/**
 * Keeps the company name from crowding the navbar. Truncated names end in an
 * ellipsis and stay within COMPANY_NAME_MAX_LENGTH characters overall.
 */
export function truncateCompanyName(name: string, maxLength = COMPANY_NAME_MAX_LENGTH): string {
  if (name.length <= maxLength) return name;

  return `${name.slice(0, maxLength - 1)}…`;
}
