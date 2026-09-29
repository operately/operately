import React from "react";
import { Trans } from "react-i18next";

import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";

export interface ScheduledPostDateProps {
  scheduledAt: string | Date;
  formattedTimePreferences: FormattedTimePreferences;
}

export function ScheduledPostDate({ scheduledAt, formattedTimePreferences }: ScheduledPostDateProps) {
  return (
    <div className="text-sm text-content-dimmed">
      <Trans
        i18nKey="Will be posted on <date/> at <time/>"
        components={{
          date: <FormattedTime {...formattedTimePreferences} time={scheduledAt} format="long-date" />,
          time: <FormattedTime {...formattedTimePreferences} time={scheduledAt} format="time-only" />,
        }}
      />
    </div>
  );
}
