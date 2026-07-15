import React from "react";

import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { Tooltip } from "../Tooltip";
import { parseCheckInTimestamp, type CheckInTimestamp } from "./timestamp";

export interface PostedTimeProps {
  time: CheckInTimestamp;
  formattedTimePreferences: FormattedTimePreferences;
}

export function PostedTime({ time, formattedTimePreferences }: PostedTimeProps) {
  const postingTime = parseCheckInTimestamp(time);

  return (
    <span>
      <Tooltip
        content={<FullPostedTimestamp postingTime={postingTime} formattedTimePreferences={formattedTimePreferences} />}
        size="sm"
      >
        <span aria-hidden="true" className="cursor-default">
          <FormattedTime {...formattedTimePreferences} time={postingTime} format="time-only" />
        </span>
      </Tooltip>
      <span className="sr-only">
        <FullPostedTimestamp postingTime={postingTime} formattedTimePreferences={formattedTimePreferences} />
      </span>
    </span>
  );
}

function FullPostedTimestamp({
  postingTime,
  formattedTimePreferences,
}: {
  postingTime: Date;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  return (
    <>
      Posted <FormattedTime {...formattedTimePreferences} time={postingTime} format="long-date" /> at{" "}
      <FormattedTime {...formattedTimePreferences} time={postingTime} format="time-only" />
    </>
  );
}
