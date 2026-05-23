import React from "react";
import { formatDate } from "@/utils/formatting";

import * as Time from "@/utils/time";

export default function ShortDate({
  time,
  weekday,
  locale,
}: {
  time: Date;
  weekday: boolean;
  locale: string;
}): JSX.Element {
  let options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  if (!Time.isCurrentYear(time)) {
    options.year = "numeric";
  }

  let prefix = "";

  if (weekday) {
    if (isToday(time)) {
      prefix = "Today, ";
    } else if (isYesterday(time)) {
      prefix = "Yesterday, ";
    } else {
      options.weekday = "long";
    }
  }

  return <>{prefix + formatDate(time, locale, options)}</>;
}

function isSameDay(date: Date, other: Date) {
  return (
    date.getDate() === other.getDate() &&
    date.getMonth() === other.getMonth() &&
    date.getFullYear() === other.getFullYear()
  );
}

function isToday(date: Date) {
  const today = new Date();

  return isSameDay(date, today);
}

function isYesterday(date: Date) {
  const yesteday = new Date(+new Date() - 86400000);

  return isSameDay(date, yesteday);
}
