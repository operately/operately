import React from "react";

import { formatDate } from "../utils/formatting";
import * as Time from "../utils/time";

export default function ShortDateWithWeekday({ time, locale }: { time: Date; locale: string }): JSX.Element {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    weekday: "short",
  };

  if (!Time.isCurrentYear(time)) {
    options.year = "numeric";
  }

  return <>{formatDate(time, locale, options)}</>;
}
