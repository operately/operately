import * as datefsn from "date-fns";

export function now() {
  return new Date();
}

export function today() {
  return datefsn.startOfDay(new Date());
}

export function daysAgo(days: number) {
  return datefsn.subDays(today(), days);
}

export function isThisWeek(date: Date) {
  return datefsn.isThisWeek(date);
}

export function isFirstDayOfMonth(date: Date) {
  return date.getDate() === 1;
}

export function isLastDayOfMonth(date: Date) {
  return date.getDate() === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function addDays(date: Date, days: number) {
  return datefsn.addDays(date, days);
}

export function daysFromNow(days: number) {
  return datefsn.addDays(today(), days);
}

export function compareAsc(date1: Date | null, date2: Date | null, { nullsFirst = false } = {}) {
  if (!date1 && !date2) return 0;
  if (!date1 && date2) return nullsFirst ? -1 : 1;
  if (date1 && !date2) return nullsFirst ? 1 : -1;

  return datefsn.compareAsc(date1!, date2!);
}

export function parse(date: string | Date | null | undefined) {
  if (date === null || date === undefined) {
    return null;
  }

  if (date instanceof Date) {
    return date;
  }

  if (typeof date === "string") {
    if (date.length === 10) {
      return parseDate(date);
    } else {
      let res = parseISO(date);
      if (isNaN(res.getTime())) throw new Error("Invalid date");
      return res;
    }
  }

  throw new Error("Invalid date");
}

export function parseDate(date: Date | string | null | undefined): Date | null {
  if (date === null || date === undefined) return null;
  if (date.constructor.name === "Date") return date as Date;

  const d = date as string;

  if (d.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return datefsn.parse(date as string, "yyyy-MM-dd", new Date());
  }

  // parse dates like "2024-07-15T00:00:00Z"
  if (d.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/)) {
    const shorted = d.slice(0, 10);
    return datefsn.parse(shorted, "yyyy-MM-dd", new Date());
  }

  throw new Error("Invalid date " + date);
}

export function parseISO(date: string) {
  return datefsn.parseISO(date);
}

export function isToday(date: Date) {
  return datefsn.isToday(date);
}

export function isYesterday(date: Date) {
  return datefsn.isYesterday(date);
}

export function isTomorrow(date: Date) {
  return datefsn.isTomorrow(date);
}

export function isPast(date: Date) {
  return datefsn.isPast(date);
}

export function isFuture(date: Date) {
  return datefsn.isFuture(date);
}

export function toDateWithoutTime(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function isCurrentYear(date: Date) {
  return date.getFullYear() === new Date().getFullYear();
}

function weeksBetween(start: Date, end: Date) {
  return datefsn.differenceInWeeks(end, start);
}

export function daysBetween(start: Date, end: Date) {
  return datefsn.differenceInDays(end, start);
}

export function hoursBetween(start: Date, end: Date) {
  return datefsn.differenceInHours(end, start);
}

export function getMonthName(date: Date) {
  return datefsn.format(date, "MMMM");
}

export function isSameDay(date1: Date, date2: Date) {
  return datefsn.isSameDay(date1, date2);
}

export function relativeDay(date: Date) {
  const startOfToday = datefsn.startOfDay(new Date());
  const startOfDayOfDate = datefsn.startOfDay(date);

  const days = daysBetween(startOfDayOfDate, startOfToday);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";

  return `${days} days ago`;
}

export function dateChanged(old: Date | null, current: Date | null): boolean {
  if (!old && !current) return false;
  if (!old && current) return true;
  if (old && !current) return true;

  return !isSameDay(old!, current!);
}

export function durationHumanized(a: Date, b: Date, suffix?: string): string {
  const days = daysBetween(a, b);
  if (days === 0) return "Last day";
  if (days === 1) return withSuffix("1 day", suffix);
  if (days < 14) return withSuffix(`${days} days`, suffix);

  const weeks = weeksBetween(a, b);
  if (days < 60) return withSuffix(`${weeks} weeks`, suffix);

  const months = Math.floor(days / 30);
  if (days < 365) return withSuffix(`${months} months`, suffix);

  const years = Math.floor(days / 365);
  if (years === 1) return withSuffix(`${years} year`, suffix);

  return withSuffix(`${years} years`, suffix);
}

function withSuffix(str: string, suffix?: string): string {
  if (suffix) {
    return `${str} ${suffix}`;
  } else {
    return str;
  }
}
