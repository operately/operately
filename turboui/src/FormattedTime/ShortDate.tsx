import React from "react";
import { useTranslation } from "react-i18next";

import { formatDate } from "../utils/formatting";
import * as Time from "../utils/time";

export default function ShortDate({
  time,
  weekday,
  locale,
  withYear = false,
}: {
  time: Date;
  weekday: boolean;
  locale: string;
  withYear?: boolean;
}): JSX.Element {
  const { t } = useTranslation();

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  if (withYear || !Time.isCurrentYear(time)) {
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
