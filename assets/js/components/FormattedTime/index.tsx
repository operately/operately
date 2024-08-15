import * as React from "react";
import * as Time from "@/utils/time";

import TimeOnly from "./TimeOnly";
import LongDate from "./LongDate";
import ShortDate from "./ShortDate";
import RelativeTime from "./RelativeTime";
import ShortDateWithWeekday from "./ShortDateWithWeekday";
import RelativeWeekdayOrDate from "./RelativeWeekdayOrDate";

type Format =
  | "relative"
  | "short-date"
  | "short-date-with-weekday"
  | "time-only"
  | "relative-weekday-or-date"
  | "long-date";

interface FormattedTimeProps {
  time: string | Date;
  format: Format;
}

export default function FormattedTime(props: FormattedTimeProps): JSX.Element {
  const parsedTime = Time.parse(props.time);
  if (!parsedTime) throw "Invalid date " + props.time;

  switch (props.format) {
    case "relative":
      return <RelativeTime time={parsedTime} />;
    case "relative-weekday-or-date":
      return <RelativeWeekdayOrDate time={parsedTime} />;
    case "short-date":
      return <ShortDate time={parsedTime} weekday={false} />;
    case "short-date-with-weekday":
      return <ShortDateWithWeekday time={parsedTime} />;
    case "time-only":
      return <TimeOnly time={parsedTime} />;
    case "long-date":
      return <LongDate time={parsedTime} />;
    default:
      throw "Unknown format " + props.format;
  }
}
