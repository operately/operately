import * as React from "react";
import { CheckInMetadata, CheckInTitle, displayDate } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

import { useLoadedData } from "./loader";

export function Header() {
  const { update } = useLoadedData();
  const formattedTimePreferences = useFormattedTimePreferences();

  const checkInDate = displayDate(update);

  return (
    <div className="flex flex-col items-center">
      <CheckInTitle state={update.state} timestamp={checkInDate} formattedTimePreferences={formattedTimePreferences} />
      <CheckInMetadata
        resourceType="goal"
        author={update.author}
        acknowledgedBy={update.acknowledgingPerson}
        state={update.state}
        postedAt={checkInDate}
        scheduledAt={update.scheduledAt}
        formattedTimePreferences={formattedTimePreferences}
      />
    </div>
  );
}
