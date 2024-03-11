import React from "react";
import { useTranslation } from "react-i18next";
import * as Time from "@/utils/time";
import ShortDateWithWeekday from "./ShortDateWithWeekday";

export default function ({ time }: { time: Date }): JSX.Element {
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
    const params = {
      val: time,
      formatParams: {
        val: {
          weekday: "long",
        },
      },
    };

    return <>this {t("intlDateTime", params)}</>;
  }

  return <ShortDateWithWeekday time={time} />;
}
