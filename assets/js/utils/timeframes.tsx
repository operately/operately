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

// import * as Time from "@/utils/time";

// const YEAR_REGEX = /^\d{4}$/;

// const QUARTER_REGEX_TYPE_1 = /^Q[1-4] \d{4}$/;
// const QUARTER_REGEX_TYPE_2 = /^\d{4}-Q[1-4]$/;

// const quarters = {
//   Q1: { start: "01-01", end: "03-31" },
//   Q2: { start: "04-01", end: "06-30" },
//   Q3: { start: "07-01", end: "09-30" },
//   Q4: { start: "10-01", end: "12-31" },
// };

// export class Timeframe {
//   static parse(timeframe: string): Timeframe {
//     if (timeframe.match(YEAR_REGEX)) {
//       return new Timeframe(Time.parse(`${timeframe}-01-01`)!, Time.parse(`${timeframe}-12-31`)!);
//     }

//     if (timeframe.match(QUARTER_REGEX_TYPE_1)) {
//       const quarter = quarters[timeframe.slice(0, 2)];

//       return new Timeframe(
//         Time.parseISO(`${timeframe.slice(3)}-${quarter.start}`),
//         Time.parseISO(`${timeframe.slice(3)}-${quarter.end}`),
//       );
//     }

//     if (timeframe.match(QUARTER_REGEX_TYPE_2)) {
//       const quarter = quarters[timeframe.slice(5)];

//       return new Timeframe(
//         Time.parseISO(`${timeframe.slice(0, 4)}-${quarter.start}`),
//         Time.parseISO(`${timeframe.slice(0, 4)}-${quarter.end}`),
//       );
//     }

//     throw new Error(`Invalid timeframe: ${timeframe}`);
//   }

//   constructor(
//     public readonly start: Date,
//     public readonly end: Date,
//   ) {}

//   isOverdue(): boolean {
//     return !Time.isToday(this.end) && Time.isPast(this.end);
//   }

//   remainingDays(): number {
//     if (this.isOverdue()) {
//       return 0;
//     }

//     return Time.daysBetween(Time.today(), this.end);
//   }

//   overdueDays(): number {
//     if (this.isOverdue()) {
//       return Time.daysBetween(this.end, Time.today());
//     }

//     return 0;
//   }
// }
