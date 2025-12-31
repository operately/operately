import React from "react";
import { Fragment } from "react";
import { useRenderInterval } from "./useRenderInterval";
import { useWindowSizeBiggerOrEqualTo } from "../utils/useWindowSizeBreakpoint";

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

  if (seconds < 10) {
    return <Fragment key={lastRender}>just now</Fragment>;
  }

  if (seconds < 60) {
    return <Fragment key={lastRender}>{seconds} seconds ago</Fragment>;
  }

  if (minutes < 60) {
    const unit = isLargeScreen ? (minutes === 1 ? "minute" : "minutes") : "min.";
    return (
      <Fragment key={lastRender}>
        {minutes} {unit} ago
      </Fragment>
    );
  }

  if (hours < 24) {
    return (
      <Fragment key={lastRender}>
        {hours} {hours === 1 ? "hour" : "hours"} ago
      </Fragment>
    );
  }

  if (days < 7) {
    return (
      <Fragment key={lastRender}>
        {days} {days === 1 ? "day" : "days"} ago
      </Fragment>
    );
  }

  if (days < 30) {
    return (
      <Fragment key={lastRender}>
        {weeks} {weeks === 1 ? "week" : "weeks"} ago
      </Fragment>
    );
  }

  if (months < 12) {
    return (
      <Fragment key={lastRender}>
        {months} {months === 1 ? "month" : "months"} ago
      </Fragment>
    );
  }

  return (
    <Fragment key={lastRender}>
      {years} {years === 1 ? "year" : "years"} ago
    </Fragment>
  );
}
