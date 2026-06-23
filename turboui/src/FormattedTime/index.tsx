import React from "react";
import { match } from "ts-pattern";

import * as Time from "../utils/time";
import LongDate from "./LongDate";
import RelativeTime from "./RelativeTime";
import RelativeTimeOrDate from "./RelativeTimeOrDate";
import RelativeWeekdayOrDate from "./RelativeWeekdayOrDate";
import ShortDate from "./ShortDate";
import ShortDateWithWeekday from "./ShortDateWithWeekday";
import TimeOnly from "./TimeOnly";
import type { FormattedTimePreferences } from "./types";

export type { FormattedTimePreferences } from "./types";
export { defaultFormattedTimePreferences } from "./types";

export type Format =
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

export interface FormattedTimeProps extends FormattedTimePreferences {
  time: string | Date;
  format: Format;
}

export function FormattedTime(props: FormattedTimeProps): JSX.Element {
  const { locale, timezone, timeFormat, time, format } = props;

  const parsedTime = match(format)
    .with("relative", () => Time.parse(time))
    .with("time-only", () => Time.parse(time))
    .with("relative-time-or-date", () => Time.parse(time))
    .otherwise(() => Time.parseDate(time));

  if (!parsedTime) throw new Error("Invalid date " + time);

  const localizedTime = applyTimezone(parsedTime, timezone);

  switch (format) {
    case "relative":
      return <RelativeTime time={localizedTime} locale={locale} />;
    case "relative-weekday-or-date":
      return <RelativeWeekdayOrDate time={localizedTime} locale={locale} />;
    case "relative-time-or-date":
      return <RelativeTimeOrDate time={localizedTime} locale={locale} />;
    case "short-date":
      return <ShortDate time={localizedTime} weekday={false} locale={locale} />;
    case "short-date-with-weekday":
      return <ShortDateWithWeekday time={localizedTime} locale={locale} />;
    case "time-only":
      return <TimeOnly time={localizedTime} locale={locale} timeFormat={timeFormat} />;
    case "long-date":
      return <LongDate time={localizedTime} locale={locale} />;
    default:
      throw new Error(`Unknown format ${format}`);
  }
}

// Shift wall-clock fields into the target timezone. en-US is fine to hardcode here: this string
// is never shown, only parsed, and en-US gives a format new Date() accepts reliably; locale applies in sub-components.
function applyTimezone(time: Date, timezone: string): Date {
  return new Date(time.toLocaleString("en-US", { timeZone: timezone }));
}

export default FormattedTime;
