import React from "react";
import { useTranslation } from "react-i18next";
import * as Time from "@/utils/time";
import ShortDateWithWeekday from "./ShortDateWithWeekday";
import { formatDate } from "@/utils/formatting";

export default function ({ time, locale }: { time: Date; locale: string }): JSX.Element {
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
    const params: Intl.DateTimeFormatOptions = {
      weekday: "long",
    };

    return <>this {formatDate(time, locale, params)}</>;
  }

  return <ShortDateWithWeekday time={time} locale={locale} />;
}
