import React from "react";
import * as Time from "@/utils/time";
import { useTranslation } from "react-i18next";
import { findOrdinalNumberSuffix } from "@/utils/numbers";

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
  const day = time.getDate();
  const suffix = findOrdinalNumberSuffix(day);

  return (
    <>
      {t("intlDateTime", options)}
      {suffix}
      {Time.isCurrentYear(time) ? "" : ", " + time.getFullYear()}
    </>
  );
}
