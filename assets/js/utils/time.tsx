import * as datefsn from "date-fns";
import * as Quarters from "./quarters";

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

export function endOfToday() {
  return datefsn.endOfDay(new Date());
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
  if (d.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/)) {
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

export function currentYear() {
  return new Date().getFullYear();
}

export function nextYear() {
  return new Date().getFullYear() + 1;
}

export function currentQuarter() {
  return nQuartersFromNow(0);
}

export function nextQuarter(from: string) {
  const q = Quarters.fromString(from);
  const next = Quarters.next(q);

  return Quarters.toString(next);
}

export function prevQuarter(from: string) {
  const q = Quarters.fromString(from);
  const prev = Quarters.prev(q);

  return Quarters.toString(prev);
}

export function nQuartersFromNow(quarters: number) {
  const current = Quarters.current();
  const result = Quarters.addQuarters(current, quarters);

  return Quarters.toString(result);
}

export function isCurrentYear(date: Date) {
  return date.getFullYear() === new Date().getFullYear();
}

export function weeksBetween(start: Date, end: Date) {
  return datefsn.differenceInWeeks(end, start);
}

export function daysBetween(start: Date, end: Date) {
  return datefsn.differenceInDays(end, start);
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

export function humanDuration(start: Date, end: Date): string {
  const days = daysBetween(start, end);

  if (days === 0) return "0 days";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;

  if (days < 30) {
    const weeks = Math.floor(days / 7);

    if (weeks === 1) return "1 week";
    return `${weeks} weeks`;
  }

  if (days < 365) {
    const months = Math.floor(days / 30);

    if (months === 1) return "1 month";
    return `${months} months`;
  }

  const years = Math.floor(days / 365);

  if (years === 1) return "1 year";
  return `${years} years`;
}

export function dateChanged(old: Date | null, current: Date | null): boolean {
  if (!old && !current) return false;
  if (!old && current) return true;
  if (old && !current) return true;

  return !isSameDay(old!, current!);
}

export function calculateHowManyDaysAgo(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();

  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const delta = today.getTime() - date.getTime();
  const days = Math.floor(delta / (1000 * 60 * 60 * 24));

  switch (days) {
    case 0:
      return "Today";
    case 1:
      return "Yesterday";
    default:
      return `${days} days ago`;
  }
}
