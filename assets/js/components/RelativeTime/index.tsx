import React from 'react';
import { useTranslation } from 'react-i18next';

function utcDate() : number {
  var now = new Date();

  return +(new Date(now.getTime() + now.getTimezoneOffset() * 60000));
}

interface Props {
  date: string;
}

export default function RelativeTime({date} : Props) : JSX.Element {
  const { t } = useTranslation();

  const diff = utcDate() - Date.parse(date);

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return <>{t("intlRelativeDateTime", {val: -seconds, range: "second"})}</>;
  }

  if (minutes < 60) {
    return <>{t("intlRelativeDateTime", {val: -minutes, range: "minute"})}</>;
  }

  if (hours < 24) {
    return <>{t("intlRelativeDateTime", {val: -hours, range: "hour"})}</>;
  }

  if (days < 7) {
    return <>{t("intlRelativeDateTime", {val: -days, range: "day"})}</>;
  }

  if (weeks < 4) {
    return <>{t("intlRelativeDateTime", {val: -weeks, range: "week"})}</>;
  }

  if (months < 12) {
    return <>{t("intlRelativeDateTime", {val: -months, range: "month"})}</>;
  }

  return <>{t("intlRelativeDateTime", {val: -years, range: "year"})}</>;
}
