import React from "react";
import * as Time from "../utils/time";
import ShortDateWithWeekday from "./ShortDateWithWeekday";

export default function RelativeWeekdayOrDate({ time }: { time: Date }) {
  if (Time.isToday(time)) {
    return <>Today</>;
  }

  if (Time.isYesterday(time)) {
    return <>Yesterday</>;
  }

  if (Time.isTomorrow(time)) {
    return <>Tomorrow</>;
  }

  if (Time.isFuture(time) && Time.isThisWeek(time)) {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
    };

    return <>this {time.toLocaleDateString("en-US", options)}</>;
  }

  return <ShortDateWithWeekday time={time} />;
}
