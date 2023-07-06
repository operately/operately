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
