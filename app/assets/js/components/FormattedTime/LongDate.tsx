import React from "react";
import * as Time from "@/utils/time";
import { findOrdinalNumberSuffix } from "@/utils/numbers";
import { formatDate } from "@/utils/formatting";

export default function LongDate({ time, locale }: { time: Date; locale: string }): JSX.Element {
  if (!locale.startsWith("en")) {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
    };

    if (!Time.isCurrentYear(time)) {
      options.year = "numeric";
    }

    return <>{formatDate(time, locale, options)}</>;
  }

  const formattedDate = formatDate(time, locale, {
    day: "numeric",
    month: "long",
  });
  const day = time.getDate();
  const suffix = findOrdinalNumberSuffix(day);

  return (
    <>
      {formattedDate}
      {suffix}
      {Time.isCurrentYear(time) ? "" : ", " + time.getFullYear()}
    </>
  );
}
