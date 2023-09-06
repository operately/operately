import * as datefsn from "date-fns";

export function today() {
  return datefsn.startOfDay(new Date());
}

export function epochZero() {
  return new Date(0);
}

export function endOfNextWeek() {
  return datefsn.endOfWeek(sameDayNextWeek());
}

export function sameDayNextWeek() {
  return datefsn.addWeeks(new Date(), 1);
}

export function endOfToday() {
  return datefsn.endOfDay(new Date());
}

export function parse(date: string | Date | null | undefined) {
  if (date === null || date === undefined) {
    return null;
  }

  if (typeof date === "string") {
    let parsed = Date.parse(date);

    if (isNaN(parsed)) {
      throw new Error("Invalid date");
    }

    return new Date(parsed);
  }

  if (date instanceof Date) {
    return date;
  }

  throw new Error("Invalid date");
}

export function parseISO(date: string) {
  return datefsn.parseISO(date);
}

export function isToday(date: Date) {
  return datefsn.isToday(date);
}

export function isPast(date: Date) {
  return datefsn.isPast(date);
}

export function toDateWithoutTime(date: Date) {
  return date.toISOString().split("T")[0];
}

export function parseDateWithoutTime(date: string) {
  return new Date(Date.parse(date));
}

export function isCurrentYear(date: Date) {
  return date.getFullYear() === new Date().getFullYear();
}

export function startOfWeek(date: Date) {
  return datefsn.startOfWeek(date);
}

export function endOfWeek(date: Date) {
  return datefsn.endOfWeek(date);
}

export function closestMonday(date: Date, direction: "before" | "after") {
  if (direction === "before") {
    return datefsn.startOfWeek(date);
  } else {
    if (datefsn.isMonday(date)) {
      return date;
    } else {
      return datefsn.startOfWeek(datefsn.addWeeks(date, 1));
    }
  }
}

export function everyMondayBetween(start: Date, end: Date, inclusive = false) {
  let mondays = [] as Date[];

  let current = start;

  while (current <= end) {
    mondays.push(current);
    current = datefsn.addWeeks(current, 1);
  }

  if (!inclusive) {
    mondays.pop();
  }

  return mondays;
}

export function add(date: Date, amount: number, unit: "days" | "weeks" | "months" | "years") {
  return datefsn.add(date, { [unit]: amount });
}

export function daysBetween(start: Date, end: Date) {
  return datefsn.differenceInDays(end, start);
}

export function secondsBetween(start: Date, end: Date) {
  return datefsn.differenceInSeconds(end, start);
}

export function earliest(...dates: (Date | null | undefined)[]) {
  let earliest: Date | null = null;

  dates.forEach((date) => {
    if (date && (!earliest || date < earliest)) {
      earliest = date;
    }
  });

  return earliest;
}

export function latest(...dates: (Date | null | undefined)[]) {
  let latest: Date | null = null;

  dates.forEach((date) => {
    if (date && (!latest || date > latest)) {
      latest = date;
    }
  });

  return latest;
}
