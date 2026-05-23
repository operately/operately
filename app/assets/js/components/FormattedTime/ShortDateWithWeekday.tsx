import React from "react";
import { formatDate } from "@/utils/formatting";

function isCurrentYear(date: Date) {
  return date.getFullYear() === new Date().getFullYear();
}

export default function ShortDateWithWeekday({ time, locale }: { time: Date; locale: string }): JSX.Element {
  let options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    weekday: "short",
  };

  if (!isCurrentYear(time)) {
    options.year = "numeric";
  }

  return <>{formatDate(time, locale, options)}</>;
}
