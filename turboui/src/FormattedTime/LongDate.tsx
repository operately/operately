import React from "react";

import * as Time from "../utils/time";
import { findOrdinalNumberSuffix } from "../utils/numbers";
import { formatDate } from "../utils/formatting";

export default function LongDate({ time, locale }: { time: Date; locale: string }): JSX.Element {
  if (!locale.toLowerCase().startsWith("en")) {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
    };

    if (!Time.isCurrentYear(time)) {
      options.year = "numeric";
    }

    return <>{formatDate(time, locale, options)}</>;
  }

  const month = formatDate(time, locale, { month: "long" });
  const day = time.getDate();
  const suffix = findOrdinalNumberSuffix(day);

  return (
    <>
      {month} {day}
      {suffix}
      {Time.isCurrentYear(time) ? "" : ", " + time.getFullYear()}
    </>
  );
}
