import * as React from "react";
import * as Time from "@/utils/time";

import TimeOnly from "./TimeOnly";
import LongDate from "./LongDate";
import ShortDate from "./ShortDate";
import RelativeTime from "./RelativeTime";
import ShortDateWithWeekday from "./ShortDateWithWeekday";
import RelativeWeekdayOrDate from "./RelativeWeekdayOrDate";
import RelativeTimeOrDate from "./RelativeTimeOrDate";
import { useTimezone } from "@/contexts/TimezoneContext";
import { match } from "ts-pattern";

type Format =
  | "relative"
  | "short-date"
  | "short-date-with-weekday"
  | "time-only"
  | "relative-weekday-or-date"
  | "long-date"
  | "relative-time-or-date";

//
// Formats:
//
// relative: "just now", "5 minutes ago"
// relative-time-or-date: "just now", "5 minutes ago", "1 hour ago", "Yesterday", "Wed, Sep 18"
// relative-weekday-or-date: "Today", "Yesterday", "Mon", "Apr 5"
// short-date: "Apr 5", "Apr 5, 2021"
// short-date-with-weekday: "Mon, Apr 5", "Mon, Apr 5, 2021"
// time-only: "5:00pm"
// long-date: "April 5, 2021"
//

interface FormattedTimeProps {
  time: string | Date;
  format: Format;
}

export default function FormattedTime(props: FormattedTimeProps): JSX.Element {
  const timezone = useTimezone();

  const parsedTime = match(props.format)
    .with("relative", () => Time.parse(props.time))
    .with("time-only", () => Time.parse(props.time))
    .with("relative-time-or-date", () => Time.parse(props.time))
    .otherwise(() => Time.parseDate(props.time));

  if (!parsedTime) throw "Invalid date " + props.time;

  const time = applyTimezone(parsedTime, timezone);

  switch (props.format) {
    case "relative":
      return <RelativeTime time={time} />;
    case "relative-weekday-or-date":
      return <RelativeWeekdayOrDate time={time} />;
    case "relative-time-or-date":
      return <RelativeTimeOrDate time={time} />;
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
