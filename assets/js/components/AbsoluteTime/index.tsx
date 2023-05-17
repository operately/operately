import React from "react";
import { useTranslation } from "react-i18next";

interface Props {
  date: Date;
}

export default function AbsoluteTime({ date }: Props): JSX.Element {
  const { t } = useTranslation();

  if (!date) return <></>;

  return (
    <>
      {t("intlDateTime", {
        val: new Date(date),
        formatParams: {
          val: {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          },
        },
      })}
    </>
  );
}
