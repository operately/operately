import React, { Fragment } from "react";

import RelativeWeekdayOrDate from "./RelativeWeekdayOrDate";
import RelativeTime from "./RelativeTime";
import { useRenderInterval } from "./useRenderInterval";
import * as Time from "../utils/time";

export default function RelativeTimeOrDate({ time, locale }: { time: Date; locale: string }) {
  const lastRender = useRenderInterval(time);

  const now = new Date();
  const delta = Time.hoursBetween(time, now);

  return (
    <Fragment key={lastRender}>
      {delta < 24 ? <RelativeTime time={time} locale={locale} /> : <RelativeWeekdayOrDate time={time} locale={locale} />}
    </Fragment>
  );
}
