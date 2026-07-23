import { browserLocale, formatNumber } from "./formatting";

export type TargetProgressFields = {
  from?: number | null;
  to?: number | null;
  value?: number | null;
  unit?: string | null;
};

/**
 * Progress of a goal target from `from` toward `to` based on `value`.
 * When `clamped` is true, the result is limited to 0–100.
 */
export function calculateTargetProgress(target: TargetProgressFields, clamped = true): number {
  const from = target.from ?? 0;
  const to = target.to ?? 0;
  const value = target.value ?? 0;

  let percentage: number;
  if (from === to) {
    percentage = 0;
  } else if (from < to) {
    percentage = ((value - from) / (to - from)) * 100;
  } else {
    percentage = ((from - value) / (from - to)) * 100;
  }

  if (clamped) {
    return Math.max(0, Math.min(100, percentage));
  }

  return percentage;
}

/**
 * Formats a target numeric value with its unit, using the browser (or provided) locale.
 */
export function formatValueAndUnit(value: number, unit: string, locale: string = browserLocale()): string {
  const formatted = formatNumber(value, locale);

  if (unit === "%") return `${formatted}%`;
  if (unit === "") return formatted;
  return `${formatted} ${unit}`;
}

/**
 * Compact "current → target" summary for tooltips and read-only lists.
 */
export function formatTargetValueSummary(
  target: TargetProgressFields,
  locale: string = browserLocale(),
): string | null {
  const value = target.value;
  const to = target.to;
  const unit = target.unit ?? "";

  if (value == null || to == null) return null;

  return `${formatValueAndUnit(value, unit, locale)} → ${formatValueAndUnit(to, unit, locale)}`;
}
