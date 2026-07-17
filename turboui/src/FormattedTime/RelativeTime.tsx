import React from "react";
import { useTranslation } from "react-i18next";

import { useRenderInterval } from "./useRenderInterval";
import { useWindowSizeBiggerOrEqualTo } from "../utils/useWindowSizeBreakpoint";
import { Tooltip } from "../Tooltip";

interface RelativeTimeProps {
  time: Date;
  locale: string;
  timezone?: string;
}

export default function RelativeTime({
  time,
  locale,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}: RelativeTimeProps): JSX.Element {
  const { t } = useTranslation();
  const currentTime = useRenderInterval(time);
  const isLargeScreen = useWindowSizeBiggerOrEqualTo("sm");

  const diff = currentTime - time.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const precision = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(time);

  let label = "";

  if (seconds < 10) {
    label = t("intlRelativeDateTimeJustNow");
  } else if (seconds < 60) {
    label = t("intlRelativeDateTime", { val: -seconds, range: "second" });
  } else if (minutes < 60) {
    const useAbbreviatedMinutes = !isLargeScreen && locale.toLowerCase().startsWith("en");

    label = useAbbreviatedMinutes
      ? `${minutes} min. ago`
      : t("intlRelativeDateTime", { val: -minutes, range: "minute" });
  } else if (hours < 24) {
    label = t("intlRelativeDateTime", { val: -hours, range: "hour" });
  } else if (days < 7) {
    label = t("intlRelativeDateTime", { val: -days, range: "day" });
  } else if (days < 30) {
    label = t("intlRelativeDateTime", { val: -weeks, range: "week" });
  } else if (months < 12) {
    label = t("intlRelativeDateTime", { val: -months, range: "month" });
  } else {
    label = t("intlRelativeDateTime", { val: -years, range: "year" });
  }

  return (
    <Tooltip content={precision} size="sm" delayDuration={600}>
      <span className="cursor-default">{label}</span>
    </Tooltip>
  );
}
