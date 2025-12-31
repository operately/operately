import React from "react";
import { useRenderInterval } from "./useRenderInterval";
import { useWindowSizeBiggerOrEqualTo } from "../utils/useWindowSizeBreakpoint";
import { Tooltip } from "../Tooltip";

interface RelativeTimeProps {
  time: Date;
}

export default function RelativeTime({ time }: RelativeTimeProps): JSX.Element {
  const lastRender = useRenderInterval(time);
  const isLargeScreen = useWindowSizeBiggerOrEqualTo("sm");

  const diff = +new Date() - +time;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const precision = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(time);

  let label = "";

  if (seconds < 10) {
    label = "just now";
  } else if (seconds < 60) {
    label = `${seconds} seconds ago`;
  } else if (minutes < 60) {
    const unit = isLargeScreen ? (minutes === 1 ? "minute" : "minutes") : "min.";
    label = `${minutes} ${unit} ago`;
  } else if (hours < 24) {
    label = `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (days < 7) {
    label = `${days} ${days === 1 ? "day" : "days"} ago`;
  } else if (days < 30) {
    label = `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  } else if (months < 12) {
    label = `${months} ${months === 1 ? "month" : "months"} ago`;
  } else {
    label = `${years} ${years === 1 ? "year" : "years"} ago`;
  }

  return (
    <Tooltip content={precision} size="sm" delayDuration={600}>
      <span key={lastRender} className="cursor-default">
        {label}
      </span>
    </Tooltip>
  );
}
