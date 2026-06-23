import React from "react";
import { useTranslation } from "react-i18next";

import * as Time from "../utils/time";
import { formatDate } from "../utils/formatting";
import ShortDateWithWeekday from "./ShortDateWithWeekday";

export default function RelativeWeekdayOrDate({ time, locale }: { time: Date; locale: string }): JSX.Element {
  const { t } = useTranslation();

  if (Time.isToday(time)) {
    return <>{t("Today")}</>;
  }

  if (Time.isYesterday(time)) {
    return <>{t("Yesterday")}</>;
  }

  if (Time.isTomorrow(time)) {
    return <>{t("Tomorrow")}</>;
  }

  if (Time.isFuture(time) && Time.isThisWeek(time)) {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
    };

    return <>this {formatDate(time, locale, options)}</>;
  }

  return <ShortDateWithWeekday time={time} locale={locale} />;
}
