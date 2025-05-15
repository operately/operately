import React from "react";
import * as Time from "../utils/time";

export default function ShortDateWithWeekday({ time }: { time: Date }) {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    weekday: "short",
  };

  if (!Time.isCurrentYear(time)) {
    options.year = "numeric";
  }

  return <>{time.toLocaleDateString("en-US", options)}</>;
}
