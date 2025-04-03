import React from "react";
import { useTranslation } from "react-i18next";

import * as Time from "@/utils/time";

export default function ShortDate({ time, weekday }: { time: Date; weekday: boolean }): JSX.Element {
  const { t } = useTranslation();

  let params = {
    val: time,
    formatParams: {
      val: {},
    },
  };

  params["formatParams"]["val"]["day"] = "numeric";
  params["formatParams"]["val"]["month"] = "short";

  if (!Time.isCurrentYear(time)) {
    params["formatParams"]["val"]["year"] = "numeric";
  }

  let prefix = "";

  if (weekday) {
    if (isToday(time)) {
      prefix = "Today, ";
    } else if (isYesterday(time)) {
      prefix = "Yesterday, ";
    } else {
      params["formatParams"]["val"]["weekday"] = "long";
    }
  }

  return <>{prefix + t("intlDateTime", params)}</>;
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
