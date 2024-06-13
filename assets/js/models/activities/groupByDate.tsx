import * as gql from "@/gql/generated";
import * as api from "@/api";

import * as Time from "@/utils/time";

export interface ActivityGroup {
  date: Date;
  activities: (gql.Activity | api.Activity)[];
}

export function groupByDate(activities: gql.Activity[] | api.Activity[]): ActivityGroup[] {
  const groups: ActivityGroup[] = [];

  let currentGroup: ActivityGroup | null = null;

  for (const activity of activities) {
    const date = Time.parseISO(activity.insertedAt);

    if (currentGroup === null || !Time.isSameDay(currentGroup.date, date)) {
      currentGroup = {
        date,
        activities: [],
      };

      groups.push(currentGroup);
    }

    currentGroup.activities.push(activity);
  }

  return groups;
}
