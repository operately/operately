import { match } from "ts-pattern";
import { TimeframeSelector } from ".";

//
// Parsing and serializing the timeframe
//

export function formatTimeframe(timeframe: TimeframeSelector.Timeframe) {
  return match(timeframe.type)
    .with("month", () => formatMonth(timeframe))
    .with("quarter", () => formatQuarter(timeframe))
    .with("year", () => formatYear(timeframe))
    .with("days", () => formatDays(timeframe))
    .exhaustive();
}

function formatMonth(timeframe: TimeframeSelector.Timeframe) {
  if (!timeframe.startDate) return null;
  if (!timeframe.endDate) return null;

  return timeframe.startDate.toLocaleString("default", { month: "long", year: "numeric" });
}

function formatQuarter(timeframe: TimeframeSelector.Timeframe) {
  const quarter = Math.floor(timeframe.startDate!.getMonth() / 3) + 1;
  return `Q${quarter} ${timeframe.startDate!.getFullYear()}`;
}

function formatYear(timeframe: TimeframeSelector.Timeframe) {
  if (!timeframe.startDate) return null;

  return timeframe.startDate.getFullYear().toString();
}

function formatDays(timeframe: TimeframeSelector.Timeframe) {
  if (!timeframe.startDate) return null;
  if (!timeframe.endDate) return null;

  if (timeframe.startDate.getFullYear() === timeframe.endDate.getFullYear()) {
    if (getCurrentFullYear() === timeframe.startDate.getFullYear()) {
      const start = timeframe.startDate.toLocaleString("default", { month: "long", day: "numeric" });
      const end = timeframe.endDate.toLocaleString("default", { month: "long", day: "numeric" });

      return `${start} - ${end}`;
    } else {
      const start = timeframe.startDate.toLocaleString("default", { month: "long", day: "numeric" });
      const end = timeframe.endDate.toLocaleString("default", { month: "long", day: "numeric", year: "numeric" });

      return `${start} - ${end}`;
    }
  } else {
    const start = timeframe.startDate.toLocaleString("default", { month: "long", day: "numeric", year: "numeric" });
    const end = timeframe.endDate.toLocaleString("default", { month: "long", day: "numeric", year: "numeric" });

    return `${start} - ${end}`;
  }
}

function getCurrentFullYear() {
  return new Date().getFullYear();
}

function getCurrentMonth() {
  return new Date().getMonth();
}

//
// Shortcut functions for creating timeframes
//

export function currentYear(): TimeframeSelector.Timeframe {
  return {
    startDate: new Date(getCurrentFullYear(), 0, 1),
    endDate: new Date(getCurrentFullYear(), 11, 31),
    type: "year",
  };
}

export function currentMonth(): TimeframeSelector.Timeframe {
  const now = new Date();
  return {
    startDate: new Date(getCurrentFullYear(), getCurrentMonth(), 1),
    endDate: new Date(getCurrentFullYear(), getCurrentMonth() + 1, 0),
    type: "month",
  };
}

export function currentQuarter(): TimeframeSelector.Timeframe {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);

  if (quarter === 0) {
    return firstQuarterOfYear(getCurrentFullYear());
  } else if (quarter === 1) {
    return secondQuarterOfYear(getCurrentFullYear());
  } else if (quarter === 2) {
    return thirdQuarterOfYear(getCurrentFullYear());
  } else {
    return fourthQuarterOfYear(getCurrentFullYear());
  }
}

function firstQuarterOfYear(year: number): TimeframeSelector.Timeframe {
  return {
    startDate: new Date(year, 0, 1),
    endDate: new Date(year, 2, 31),
    type: "quarter",
  };
}

function secondQuarterOfYear(year: number): TimeframeSelector.Timeframe {
  return {
    startDate: new Date(year, 3, 1),
    endDate: new Date(year, 5, 30),
    type: "quarter",
  };
}

function thirdQuarterOfYear(year: number): TimeframeSelector.Timeframe {
  return {
    startDate: new Date(year, 6, 1),
    endDate: new Date(year, 8, 30),
    type: "quarter",
  };
}

function fourthQuarterOfYear(year: number): TimeframeSelector.Timeframe {
  return {
    startDate: new Date(year, 9, 1),
    endDate: new Date(year, 11, 31),
    type: "quarter",
  };
}