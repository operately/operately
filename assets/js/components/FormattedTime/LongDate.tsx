import React from "react";
import * as Time from "@/utils/time";
import { useTranslation } from "react-i18next";

export default function LongDate({ time }: { time: Date }): JSX.Element {
  const { t } = useTranslation();

  let options = {
    val: time,
    formatParams: {
      val: {
        day: "numeric",
        month: "long",
      },
    },
  };

  let day = time.getDate();

  let suffix = "";
  if (day === 1) {
    suffix = "st";
  } else if (day === 2) {
    suffix = "nd";
  } else if (day === 3) {
    suffix = "rd";
  } else {
    suffix = "th";
  }

  return (
    <>
      {t("intlDateTime", options)}
      {suffix}
      {Time.isCurrentYear(time) ? "" : ", " + time.getFullYear()}
    </>
  );
}
