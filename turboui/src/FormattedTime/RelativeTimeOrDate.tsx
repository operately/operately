import React, { Fragment } from "react";

import RelativeWeekdayOrDate from "./RelativeWeekdayOrDate";
import RelativeTime from "./RelativeTime";
import { useRenderInterval } from "./useRenderInterval";
import * as Time from "../utils/time";
import { dateInTimezone } from "../utils/timezone";

export default function RelativeTimeOrDate({
  time,
  locale,
  timezone,
}: {
  time: Date;
  locale: string;
  timezone: string;
}) {
  const currentTime = useRenderInterval(time);

  const now = new Date(currentTime);
  const delta = Time.hoursBetween(time, now);

  return (
    <Fragment>
      {delta < 24 ? (
        <RelativeTime time={time} locale={locale} timezone={timezone} />
      ) : (
        <RelativeWeekdayOrDate time={dateInTimezone(time, timezone)} locale={locale} />
      )}
    </Fragment>
  );
}
