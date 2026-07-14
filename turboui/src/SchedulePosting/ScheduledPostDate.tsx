import React from "react";

import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";

export interface ScheduledPostDateProps {
  scheduledAt: string | Date;
  formattedTimePreferences: FormattedTimePreferences;
}

export function ScheduledPostDate({ scheduledAt, formattedTimePreferences }: ScheduledPostDateProps) {
  return (
    <div className="text-sm text-content-dimmed">
      Will be posted on <FormattedTime {...formattedTimePreferences} time={scheduledAt} format="long-date" /> at{" "}
      <FormattedTime {...formattedTimePreferences} time={scheduledAt} format="time-only" />
    </div>
  );
}
