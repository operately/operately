import Api, { Activity, GetActivitiesInput, GetActivityInput } from "@/api";
export type { Activity } from "@/api";

import * as Time from "@/utils/time";

export const getActivity = async (input: GetActivityInput) => {
  const response = await Api.getActivity(input);
  return response.activity!;
};

export const getActivities = async (input: GetActivitiesInput) => {
  const response = await Api.getActivities(input);
  return response.activities!;
};

export interface ActivityGroup {
  date: Date;
  activities: Activity[];
}

export function groupByDate(activities: Activity[]): ActivityGroup[] {
  const groups: ActivityGroup[] = [];

  let currentGroup: ActivityGroup | null = null;

  for (const activity of activities) {
    const date = Time.parseISO(activity.insertedAt!);

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
