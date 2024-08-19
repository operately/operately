import * as React from "react";
import * as Time from "@/utils/time";

import TimeOnly from "./TimeOnly";
import LongDate from "./LongDate";
import ShortDate from "./ShortDate";
import RelativeTime from "./RelativeTime";
import ShortDateWithWeekday from "./ShortDateWithWeekday";
import RelativeWeekdayOrDate from "./RelativeWeekdayOrDate";
import { useTimezone } from "@/contexts/TimezoneContext";

type Format =
  | "relative"
  | "short-date"
  | "short-date-with-weekday"
  | "time-only"
  | "relative-weekday-or-date"
  | "long-date";

//
// Formats:
//
// time-only: "5:00pm"
// short-date: "Apr 5", "Apr 5, 2021"
// short-date-with-weekday: "Mon, Apr 5", "Mon, Apr 5, 2021"
// relative: "just now", "5 minutes ago"
// relative-weekday-or-date: "Today", "Yesterday", "Mon", "Apr 5"
// long-date: "April 5, 2021"
//

interface FormattedTimeProps {
  time: string | Date;
  format: Format;
}

export default function FormattedTime(props: FormattedTimeProps): JSX.Element {
  const timezone = useTimezone();

  const parsedTime = Time.parse(props.time);
  if (!parsedTime) throw "Invalid date " + props.time;

  const time = applyTimezone(parsedTime, timezone);

  switch (props.format) {
    case "relative":
      return <RelativeTime time={time} />;
    case "relative-weekday-or-date":
      return <RelativeWeekdayOrDate time={time} />;
    case "short-date":
      return <ShortDate time={time} weekday={false} />;
    case "short-date-with-weekday":
      return <ShortDateWithWeekday time={time} />;
    case "time-only":
      return <TimeOnly time={time} />;
    case "long-date":
      return <LongDate time={time} />;
    default:
      throw "Unknown format " + props.format;
  }
}

function applyTimezone(time: Date, timezone: string): Date {
  return new Date(time.toLocaleString("en-US", { timeZone: timezone }));
}
