import * as datefsn from "date-fns";

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

export function parseISO(date: string) {
  return datefsn.parseISO(date);
}

export function isToday(date: Date) {
  return datefsn.isToday(date);
}

export function isPast(date: Date) {
  return datefsn.isPast(date);
}
