import React, { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useRenderInterval } from "./useRenderInterval";

interface RelativeTimeProps {
  time: Date;
}

export default function RelativeTime({ time }: RelativeTimeProps): JSX.Element {
  const { t } = useTranslation();
  const lastRender = useRenderInterval(time);

  const diff = +new Date() - +time;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 10) {
    return <Fragment key={lastRender}>{t("intlRelativeDateTimeJustNow")}</Fragment>;
  }

  if (seconds < 60) {
    return <Fragment key={lastRender}>{t("intlRelativeDateTime", { val: -seconds, range: "second" })}</Fragment>;
  }

  if (minutes < 60) {
    return <Fragment key={lastRender}>{t("intlRelativeDateTime", { val: -minutes, range: "minute" })}</Fragment>;
  }

  if (hours < 24) {
    return <Fragment key={lastRender}>{t("intlRelativeDateTime", { val: -hours, range: "hour" })}</Fragment>;
  }

  if (days < 7) {
    return <Fragment key={lastRender}>{t("intlRelativeDateTime", { val: -days, range: "day" })}</Fragment>;
  }

  if (weeks < 4) {
    return <Fragment key={lastRender}>{t("intlRelativeDateTime", { val: -weeks, range: "week" })}</Fragment>;
  }

  if (months < 12) {
    return <Fragment key={lastRender}>{t("intlRelativeDateTime", { val: -months, range: "month" })}</Fragment>;
  }

  return <Fragment key={lastRender}>{t("intlRelativeDateTime", { val: -years, range: "year" })}</Fragment>;
}
