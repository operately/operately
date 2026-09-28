import React from "react";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";

// Entry dates are calendar dates, not instants: do not shift them into a different day.
export function TimeDate({ date, preferences }: { date: string; preferences: FormattedTimePreferences }) {
  return <FormattedTime time={`${date}T12:00:00Z`} format="short-date-with-weekday" {...preferences} timezone="UTC" />;
}
