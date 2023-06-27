import React from "react";
import { useTranslation } from "react-i18next";

function isCurrentYear(date: Date) {
  return date.getFullYear() === new Date().getFullYear();
}

function isToday(date: Date) {
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function ShortDate({ time }: { time: Date }): JSX.Element {
  const { t } = useTranslation();

  let params = {
    val: time,
    formatParams: {
      val: {},
    },
  };

  if (isToday(time)) {
    params["formatParams"]["val"]["hour"] = "numeric";
    params["formatParams"]["val"]["minute"] = "numeric";
  } else {
    params["formatParams"]["val"]["day"] = "numeric";
    params["formatParams"]["val"]["month"] = "short";

    if (!isCurrentYear(time)) {
      params["formatParams"]["val"]["year"] = "numeric";
    }
  }

  return <>{t("intlDateTime", params)}</>;
}
