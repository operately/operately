import { compareIds } from "@/routes/paths";

export function defaultDestination(spaces: { id: string }[], generalSpaceId?: string | null): string {
  const general = spaces.find((space) => generalSpaceId && compareIds(space.id, generalSpaceId));
  return general?.id ?? (spaces.length === 1 ? spaces[0]?.id : "") ?? "";
}

/** ISO calendar date for the API; presentation uses the shared DateInput. */
export function todayInTimezone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}
