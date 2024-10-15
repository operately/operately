import React, { Fragment } from "react";

import RelativeWeekdayOrDate from "./RelativeWeekdayOrDate";
import RelativeTime from "./RelativeTime";
import { hoursBetween } from "@/utils/time";
import { useRenderInterval } from "./useRenderInterval";

export default function RelativeTimeOrDate({ time }) {
  const lastRender = useRenderInterval(time);

  const now = new Date();
  const delta = hoursBetween(time, now);

  return (
    <Fragment key={lastRender}>
      {delta < 24 ? <RelativeTime time={time} /> : <RelativeWeekdayOrDate time={time} />}
    </Fragment>
  );
}
