import React from "react";
import { useTranslation } from "react-i18next";

import { isThisWeek, isSameWeek, isPast, isFuture } from "date-fns";

interface RelativeTimeProps {
  time: Date;
}

export function RelativeTime({ time }: RelativeTimeProps): JSX.Element {
  const { t } = useTranslation();

  const diff = utcDate() - +time;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 10) {
    return <>{t("intlRelativeDateTimeJustNow")}</>;
  }

  if (seconds < 60) {
    return <>{t("intlRelativeDateTime", { val: -seconds, range: "second" })}</>;
  }

  if (minutes < 60) {
    return <>{t("intlRelativeDateTime", { val: -minutes, range: "minute" })}</>;
  }

  if (hours < 24) {
    return <>{t("intlRelativeDateTime", { val: -hours, range: "hour" })}</>;
  }

  if (days < 7) {
    return <>{t("intlRelativeDateTime", { val: -days, range: "day" })}</>;
  }

  if (weeks < 4) {
    return <>{t("intlRelativeDateTime", { val: -weeks, range: "week" })}</>;
  }

  if (months < 12) {
    return <>{t("intlRelativeDateTime", { val: -months, range: "month" })}</>;
  }

  return <>{t("intlRelativeDateTime", { val: -years, range: "year" })}</>;
}

export function RelativeDay({ time }: RelativeTimeProps): JSX.Element {
  if (isToday(time)) {
    return <>Today</>;
  }

  if (isYesterday(time)) {
    return <>Yesterday</>;
  }

  if (isTomorrow(time)) {
    return <>Tomorrow</>;
  }

  if (isFuture(time)) {
    if (isThisWeek(time)) {
      return <>On {time.toLocaleDateString("en-US", { weekday: "long" })}</>;
    }

    if (isNextWeek(time)) {
      return <>Next {time.toLocaleDateString("en-US", { weekday: "long" })}</>;
    }

    return <>In {Math.floor((+time - +new Date()) / 86400000)} days</>;
  }

  if (isPast(time)) {
    if (isThisWeek(time)) {
      return <>On {time.toLocaleDateString("en-US", { weekday: "long" })}</>;
    }

    if (isLastWeek(time)) {
      return <>Last {time.toLocaleDateString("en-US", { weekday: "long" })}</>;
    }

    return <>{Math.floor((+new Date() - +time) / 86400000)} days ago</>;
  }

  throw "Unknown date";
}

function isLastWeek(date: Date) {
  return isSameWeek(date, new Date(+new Date() - 604800000));
}

function isNextWeek(date: Date) {
  return isSameWeek(date, new Date(+new Date() + 604800000));
}

function isToday(date: Date) {
  return isSameDay(date, new Date());
}

function isYesterday(date: Date) {
  return isSameDay(date, new Date(+new Date() - 86400000));
}

function isTomorrow(date: Date) {
  return isSameDay(date, new Date(+new Date() + 86400000));
}

function isSameDay(date: Date, other: Date) {
  return (
    date.getDate() === other.getDate() &&
    date.getMonth() === other.getMonth() &&
    date.getFullYear() === other.getFullYear()
  );
}

function utcDate(): number {
  var now = new Date();

  return +new Date(now.getTime() + now.getTimezoneOffset() * 60000);
}
