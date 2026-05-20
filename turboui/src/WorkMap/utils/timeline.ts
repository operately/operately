export type TimelineScale = "week" | "month";

export interface TimelineColumn {
  key: string;
  label: string;
  shortLabel: string;
  start: Date;
  end: Date;
}

export interface TimelineDatedItem {
  name: string;
  startDate: Date | null;
  endDate: Date | null;
}

const DAY = 24 * 60 * 60 * 1000;

export function calculateRange(items: TimelineDatedItem[]) {
  const dates = items.flatMap((item) => {
    const rangeDates: Date[] = [];
    if (item.startDate) rangeDates.push(item.startDate);
    if (item.endDate) rangeDates.push(item.endDate);
    if (item.startDate && !item.endDate) {
      rangeDates.push(addDays(item.startDate, 28));
    }
    return rangeDates;
  });

  const minDate = new Date(Math.min(...dates.map((date) => date.getTime())));
  const maxDate = new Date(Math.max(...dates.map((date) => date.getTime())));

  return {
    start: startOfWeek(addDays(minDate, -7)),
    end: endOfWeek(addDays(maxDate, 7)),
  };
}

export function chooseScale(start: Date, end: Date): TimelineScale {
  const spanDays = Math.ceil((end.getTime() - start.getTime()) / DAY);
  return spanDays <= 140 ? "week" : "month";
}

export function buildColumns(start: Date, end: Date, scale: TimelineScale): TimelineColumn[] {
  const columns: TimelineColumn[] = [];
  let cursor = new Date(start);

  while (cursor < end) {
    if (scale === "week") {
      const columnStart = startOfWeek(cursor);
      const columnEnd = endOfWeek(columnStart);
      columns.push({
        key: columnStart.toISOString(),
        label: formatWeekLabel(columnStart),
        shortLabel: formatWeekSubLabel(columnStart),
        start: columnStart,
        end: columnEnd,
      });
      cursor = addDays(columnStart, 7);
      continue;
    }

    const columnStart = startOfMonth(cursor);
    const columnEnd = endOfMonth(columnStart);
    columns.push({
      key: columnStart.toISOString(),
      label: monthLabel.format(columnStart),
      shortLabel: yearLabel.format(columnStart),
      start: columnStart,
      end: columnEnd,
    });
    cursor = addMonths(columnStart, 1);
  }

  return columns;
}

export function compareTimelineItems<T extends TimelineDatedItem>(a: T, b: T) {
  const startA = a.startDate?.getTime() ?? a.endDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const startB = b.startDate?.getTime() ?? b.endDate?.getTime() ?? Number.MAX_SAFE_INTEGER;

  if (startA !== startB) return startA - startB;

  const endA = a.endDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const endB = b.endDate?.getTime() ?? Number.MAX_SAFE_INTEGER;

  if (endA !== endB) return endA - endB;

  return a.name.localeCompare(b.name);
}

export function formatRangeLabel(item: TimelineDatedItem) {
  if (item.startDate && item.endDate) {
    return `${compactDateLabel.format(item.startDate)} - ${compactDateLabel.format(item.endDate)}`;
  }

  if (item.startDate && !item.endDate) {
    return `${compactDateLabel.format(item.startDate)} - forever`;
  }

  if (!item.startDate && item.endDate) {
    return `Due ${compactDateLabel.format(item.endDate)}`;
  }

  return null;
}

export function formatMarkerDate(date: Date) {
  return markerDateLabel.format(date).toUpperCase();
}

export function formatWeekCellLabel(date: Date) {
  const end = addDays(date, 6);
  return `${dayLabel.format(date)}-${dayLabel.format(end)}`;
}

export function formatMonthLabel(date: Date) {
  return monthLabel.format(date);
}

export function formatTimelineYearRange(start: Date, end: Date) {
  const startYear = yearLabel.format(start);
  const endYear = yearLabel.format(end);

  return startYear === endYear ? startYear : `${startYear}-${endYear}`;
}

export function getBarStartDate(item: TimelineDatedItem) {
  if (item.startDate) return item.startDate;
  if (!item.endDate) return null;

  return addDays(item.endDate, -21);
}

export function getMarkerPosition(date: Date, rangeStart: number, rangeEnd: number) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  const value = normalized.getTime();
  if (value < rangeStart || value > rangeEnd) return null;

  return clampPercent(((value - rangeStart) / Math.max(rangeEnd - rangeStart, 1)) * 100);
}

export function getDateAtPosition(left: number | null, rangeStart: number, rangeEnd: number) {
  if (left === null) return null;

  const total = Math.max(rangeEnd - rangeStart, 1);
  const timestamp = rangeStart + (left / 100) * total;
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfWeek(date: Date) {
  const value = startOfWeek(date);
  value.setDate(value.getDate() + 6);
  value.setHours(23, 59, 59, 999);
  return value;
}

function startOfMonth(date: Date) {
  const value = new Date(date);
  value.setDate(1);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfMonth(date: Date) {
  const value = startOfMonth(date);
  value.setMonth(value.getMonth() + 1);
  value.setDate(0);
  value.setHours(23, 59, 59, 999);
  return value;
}

function addMonths(date: Date, months: number) {
  const value = new Date(date);
  value.setMonth(value.getMonth() + months);
  return value;
}

function formatWeekLabel(date: Date) {
  const end = addDays(date, 6);
  return `${monthDayLabel.format(date)} - ${monthDayLabel.format(end)}`;
}

function formatWeekSubLabel(date: Date) {
  return yearLabel.format(date);
}

const monthDayLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const compactDateLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const markerDateLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const monthLabel = new Intl.DateTimeFormat(undefined, { month: "short" });
const dayLabel = new Intl.DateTimeFormat(undefined, { day: "numeric" });
const yearLabel = new Intl.DateTimeFormat(undefined, { year: "numeric" });
