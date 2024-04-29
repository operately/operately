import { match } from "ts-pattern";

import * as Gql from "@/gql";
import * as Time from "@/utils/time";

//
// Type definitions
//

export type TimeframeType = "month" | "quarter" | "year" | "days";

export interface Timeframe {
  startDate: Date | null;
  endDate: Date | null;
  type: TimeframeType;
}

export type SetTimeframe = (timeframe: Timeframe) => void;

//
// Parsing and serializing the timeframe for GraphQL
//

export function parse(timeframe: Gql.Timeframe): Timeframe {
  return {
    startDate: Time.parseDate(timeframe.startDate),
    endDate: Time.parseDate(timeframe.endDate),
    type: timeframe.type as TimeframeType,
  };
}

export function serialize(timeframe: Timeframe): Gql.TimeframeInput {
  return {
    startDate: timeframe.startDate && Time.toDateWithoutTime(timeframe.startDate),
    endDate: timeframe.endDate && Time.toDateWithoutTime(timeframe.endDate),
    type: timeframe.type,
  };
}

//
// Formatting the timeframe for display
//

export function format(timeframe: Timeframe) {
  return match(timeframe.type)
    .with("month", () => formatMonth(timeframe))
    .with("quarter", () => formatQuarter(timeframe))
    .with("year", () => formatYear(timeframe))
    .with("days", () => formatDays(timeframe))
    .exhaustive();
}

function formatMonth(timeframe: Timeframe) {
  if (!timeframe.startDate) return null;
  if (!timeframe.endDate) return null;

  return timeframe.startDate.toLocaleString("default", { month: "long", year: "numeric" });
}

function formatQuarter(timeframe: Timeframe) {
  const quarter = Math.floor(timeframe.startDate!.getMonth() / 3) + 1;
  return `Q${quarter} ${timeframe.startDate!.getFullYear()}`;
}

function formatYear(timeframe: Timeframe) {
  if (!timeframe.startDate) return null;

  return timeframe.startDate.getFullYear().toString();
}

function formatDays(timeframe: Timeframe) {
  if (!timeframe.startDate) return null;
  if (!timeframe.endDate) return null;

  if (timeframe.startDate.getFullYear() !== timeframe.endDate.getFullYear()) {
    const start = timeframe.startDate.toLocaleString("default", { month: "long", day: "numeric", year: "numeric" });
    const end = timeframe.endDate.toLocaleString("default", { month: "long", day: "numeric", year: "numeric" });

    return `${start} - ${end}`;
  } else {
    const start = timeframe.startDate.toLocaleString("default", { month: "long", day: "numeric" });
    const end = timeframe.endDate.toLocaleString("default", { month: "long", day: "numeric", year: "numeric" });

    return `${start} - ${end}`;
  }
}

//
// Shortcut functions for creating timeframes
//

export function currentQuarter(): Timeframe {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);

  return {
    startDate: new Date(now.getFullYear(), quarter * 3, 1),
    endDate: new Date(now.getFullYear(), quarter * 3 + 3, 0),
    type: "quarter",
  };
}

//
// Duration calculations
//

export function isStarted(timeframe: Timeframe): boolean {
  return !!timeframe.startDate && Time.isPast(timeframe.startDate);
}

export function isOverdue(timeframe: Timeframe): boolean {
  if (!timeframe.endDate) return false;

  return !Time.isToday(timeframe.endDate) && Time.isPast(timeframe.endDate);
}

export function remainingDays(timeframe: Timeframe): number {
  if (isOverdue(timeframe)) return 0;
  if (!timeframe.endDate) return 0;

  return Time.daysBetween(Time.today(), timeframe.endDate);
}

export function overdueDays(timeframe: Timeframe): number {
  if (!isOverdue(timeframe)) return 0;
  if (!timeframe.endDate) return 0;

  return Time.daysBetween(timeframe.endDate, Time.today());
}

export function startsInDays(timeframe: Timeframe): number {
  if (isStarted(timeframe)) return 0;
  if (!timeframe.startDate) return 0;

  return Time.daysBetween(Time.today(), timeframe.startDate);
}
