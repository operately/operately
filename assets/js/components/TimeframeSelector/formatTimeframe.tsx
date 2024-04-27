import { Timeframe } from "./timeframe";
import { match } from "ts-pattern";

export function formatTimeframe(timeframe: Timeframe) {
  return match(timeframe.type)
    .with("month", () => formatTimeframeMonth(timeframe))
    .with("quarter", () => formatTimeframeQuarter(timeframe))
    .with("year", () => formatTimeframeYear(timeframe))
    .with("days", () => formatTimeframeDays(timeframe))
    .exhaustive();
}

function formatTimeframeMonth(timeframe: Timeframe) {
  if (!timeframe.startDate) return null;
  if (!timeframe.endDate) return null;

  return `${timeframe.startDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  })} - ${timeframe.endDate.toLocaleString("default", { month: "long", year: "numeric" })}`;
}

function formatTimeframeQuarter(timeframe: Timeframe) {
  const quarter = Math.floor(timeframe.startDate!.getMonth() / 3) + 1;
  return `Q${quarter} ${timeframe.startDate!.getFullYear()}`;
}

function formatTimeframeYear(timeframe: Timeframe) {
  if (!timeframe.startDate) return null;

  return timeframe.startDate.getFullYear().toString();
}

function formatTimeframeDays(timeframe: Timeframe) {
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
