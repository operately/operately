import React from "react";
import { useTranslation } from "react-i18next";

import { formatDate } from "../utils/formatting";
import * as Time from "../utils/time";

export default function ShortDate({
  time,
  weekday,
  locale,
}: {
  time: Date;
  weekday: boolean;
  locale: string;
}): JSX.Element {
  const { t } = useTranslation();

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  if (!Time.isCurrentYear(time)) {
    options.year = "numeric";
  }

  let prefix = "";

  if (weekday) {
    if (Time.isToday(time)) {
      prefix = `${t("Today")}, `;
    } else if (Time.isYesterday(time)) {
      prefix = `${t("Yesterday")}, `;
    } else {
      options.weekday = "long";
    }
  }

  return <>{prefix + formatDate(time, locale, options)}</>;
}
