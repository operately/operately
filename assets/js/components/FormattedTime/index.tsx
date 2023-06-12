import React from "react";
import { useTranslation } from "react-i18next";

type Format = "relative" | "short-date" | "short-date-with-time";

function utcDate(): number {
  var now = new Date();

  return +new Date(now.getTime() + now.getTimezoneOffset() * 60000);
}

interface RelativeTimeProps {
  time: Date;
}

function RelativeTime({ time }: RelativeTimeProps): JSX.Element {
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

function isCurrentYear(date: Date) {
  return date.getFullYear() === new Date().getFullYear();
}

function ShortDate({ time }: { time: Date }): JSX.Element {
  const { t } = useTranslation();

  let params = {
    val: time,
    formatParams: {
      val: {
        month: "short",
        day: "numeric",
      },
    },
  };

  if (!isCurrentYear(time)) {
    params["formatParams"]["val"]["year"] = "numeric";
  }

  return <>{t("intlDateTime", params)}</>;
}

function ShortDateWithTime({ time }: { time: Date }): JSX.Element {
  const { t } = useTranslation();

  let params = {
    val: time,
    formatParams: {
      val: {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      },
    },
  };

  if (!isCurrentYear(time)) {
    params["formatParams"]["val"]["year"] = "numeric";
  }

  return <>{t("intlDateTime", params)}</>;
}

export default function FormattedTime({
  time,
  format,
}: {
  time: string;
  format: Format;
}) {
  const parsedTime = new Date(time);

  if (format === "relative") {
    return <RelativeTime time={parsedTime} />;
  }

  if (format === "short-date") {
    return <ShortDate time={parsedTime} />;
  }

  if (format === "short-date-with-time") {
    return <ShortDateWithTime time={parsedTime} />;
  }

  throw "Unknown format " + format;
}
