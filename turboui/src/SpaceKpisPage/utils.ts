import type { SpaceKpisPage } from "./types";

export function formatCadence(cadence: SpaceKpisPage.Cadence): string {
  switch (cadence) {
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    default:
      return cadence;
  }
}

export const CADENCE_OPTIONS: { label: string; value: SpaceKpisPage.Cadence }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

// Compact, locale-aware number so charts/tables stay readable
// (e.g. 1500000 -> "1.5M", 87.5 -> "87.5").
export function formatValue(value: number, unit?: string): string {
  const formatted = formatNumber(value);
  if (!unit) return formatted;

  // Percent and currency-ish units read better glued to / prefixing the number.
  if (unit === "%") return `${formatted}%`;
  return `${formatted} ${unit}`;
}

export function formatNumber(value: number): string {
  const abs = Math.abs(value);

  if (abs >= 1_000_000) return trimZeroes(value / 1_000_000) + "M";
  if (abs >= 1_000) return trimZeroes(value / 1_000) + "K";

  return trimZeroes(value);
}

function trimZeroes(value: number): string {
  return Number(value.toFixed(1)).toString();
}

// Entries are stored oldest -> newest; the latest is the most recent sample.
// The list payload omits full history but carries `latestEntry`, so fall back to
// it when `entries` is empty (e.g. the list view).
export function latestEntry(kpi: SpaceKpisPage.Kpi): SpaceKpisPage.KpiEntry | null {
  if (kpi.entries.length > 0) return kpi.entries[kpi.entries.length - 1]!;
  return kpi.latestEntry ?? null;
}

// Signed delta between the two most recent entries, or null when we cannot
// compute a trend yet (0 or 1 entries).
export function latestTrend(kpi: SpaceKpisPage.Kpi): number | null {
  if (kpi.entries.length < 2) return null;

  const last = kpi.entries[kpi.entries.length - 1]!;
  const prev = kpi.entries[kpi.entries.length - 2]!;

  return last.value - prev.value;
}

// Self-contained short date (e.g. "Apr 5" / "Apr 5, 2026") so components render
// identically in Storybook and the app without a FormattedTime preferences context.
// The year is dropped for the current year unless the caller needs it, as a chart
// spanning several years does.
export function formatShortDate(date: Date, { withYear = false }: { withYear?: boolean } = {}): string {
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: withYear || !sameYear ? "numeric" : undefined,
  });
}

// Local calendar day as `YYYY-MM-DD`, matching backend `:date` inputs.
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Inverse of `toIsoDate`. `new Date("YYYY-MM-DD")` is UTC midnight, which is
// the previous calendar day in negative-offset timezones; parse the parts as
// a local date so axis ticks and labels match the stored period.
export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year!, month! - 1, day);
}
