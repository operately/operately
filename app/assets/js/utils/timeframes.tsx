import * as api from "@/api";
import * as Time from "@/utils/time";

export function getTimeframeRange({ contextualStartDate, contextualEndDate }: api.Timeframe) {
  return `${contextualStartDate?.value} - ${contextualEndDate?.value}`;
}

//
// Duration calculations
//

export function dayCount({ contextualStartDate, contextualEndDate }: api.Timeframe): number {
  if (!contextualStartDate) return 0;
  if (!contextualEndDate) return 0;

  const startDate = Time.parseDate(contextualStartDate.date);
  const endDate = Time.parseDate(contextualEndDate.date);

  if (!startDate || !endDate) return 0;

  return Time.daysBetween(startDate, endDate);
}

export function hasOverlap(a: api.Timeframe, b: api.Timeframe): boolean {
  const startDateA = Time.parseDate(a.contextualStartDate?.date);
  const endDateA = Time.parseDate(a.contextualEndDate?.date);

  const startDateB = Time.parseDate(b.contextualStartDate?.date);
  const endDateB = Time.parseDate(b.contextualEndDate?.date);

  if (!startDateA || !endDateA || !startDateB || !endDateB) return false;

  return Time.compareAsc(startDateA, endDateB) <= 0 && Time.compareAsc(startDateB, endDateA) <= 0;
}

//
// Comparison functions
//

export function equalDates(a?: api.Timeframe | null, b?: api.Timeframe | null): boolean {
  if (!a || !b) return a === b;

  const startDateA = Time.parseDate(a.contextualStartDate?.date);
  const startDateB = Time.parseDate(b.contextualStartDate?.date);
  const endDateA = Time.parseDate(a.contextualEndDate?.date);
  const endDateB = Time.parseDate(b.contextualEndDate?.date);

  if (!startDateA || !startDateB || !endDateA || !endDateB) return false;

  return Time.isSameDay(startDateA, startDateB) && Time.isSameDay(endDateA, endDateB);
}

export function compareDuration(a: api.Timeframe, b: api.Timeframe): number {
  const startDateA = Time.parseDate(a.contextualStartDate?.date);
  const endDateA = Time.parseDate(a.contextualEndDate?.date);
  const startDateB = Time.parseDate(b.contextualStartDate?.date);
  const endDateB = Time.parseDate(b.contextualEndDate?.date);

  if (!startDateA || !endDateA || !startDateB || !endDateB) return 0;

  const aDuration = Time.daysBetween(startDateA, endDateA);
  const bDuration = Time.daysBetween(startDateB, endDateB);

  if (aDuration < bDuration) return 1;
  if (aDuration > bDuration) return -1;

  return 0;
}
