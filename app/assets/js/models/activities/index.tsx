import Api, { Activity, GetActivityInput } from "@/api";
export type { Activity, ActivityContentGoalCheckIn, ActivityContentGoalTimeframeEditing, CommentThread } from "@/api";

import * as api from "@/api";
import * as Time from "@/utils/time";
import { match } from "ts-pattern";

export const getActivity = async (input: GetActivityInput) => {
  const response = await Api.getActivity(input);
  return response.activity!;
};

export interface AggregatedActivity {
  id: string; // ID of the first activity in the group
  type: "aggregated";
  action: string;
  author: Activity["author"];
  insertedAt: string; // timestamp of the earliest activity
  activities: Activity[]; // all activities in the aggregation
}

export type ActivityOrAggregated = Activity | AggregatedActivity;

export interface ActivityGroup {
  date: Date;
  activities: ActivityOrAggregated[];
}

function aggregateConsecutiveActivities(activities: Activity[]): ActivityOrAggregated[] {
  if (activities.length === 0) return [];

  const result: ActivityOrAggregated[] = [];
  let currentGroup: Activity[] = [activities[0]!];

  for (let i = 1; i < activities.length; i++) {
    const current = activities[i]!;
    const previous = activities[i - 1]!;

    // Check if activities can be aggregated:
    // 1. Same author
    // 2. Same action type
    // 3. Activities are aggregatable (certain types like editing documents)
    const canAggregate = 
      current.author?.id === previous.author?.id &&
      current.action === previous.action &&
      isAggregatableActivity(current.action);

    if (canAggregate) {
      currentGroup.push(current);
    } else {
      // Finalize current group
      if (currentGroup.length > 1) {
        result.push(createAggregatedActivity(currentGroup));
      } else {
        result.push(currentGroup[0]!);
      }
      currentGroup = [current];
    }
  }

  // Handle the last group
  if (currentGroup.length > 1) {
    result.push(createAggregatedActivity(currentGroup));
  } else {
    result.push(currentGroup[0]!);
  }

  return result;
}

function isAggregatableActivity(action: string): boolean {
  // Define which activity types can be aggregated
  return [
    "resource_hub_document_edited",
    "resource_hub_file_edited", 
    "resource_hub_link_edited",
    "goal_editing",
    "project_renamed",
    "task_name_updating",
    "milestone_title_updating",
    "milestone_description_updating",
  ].includes(action);
}

function createAggregatedActivity(activities: Activity[]): AggregatedActivity {
  // Sort by timestamp to get the earliest
  const sorted = activities.sort((a, b) => 
    new Date(a.insertedAt!).getTime() - new Date(b.insertedAt!).getTime()
  );

  return {
    id: sorted[0]!.id + "_aggregated",
    type: "aggregated",
    action: sorted[0]!.action,
    author: sorted[0]!.author,
    insertedAt: sorted[0]!.insertedAt, // Use earliest timestamp
    activities: sorted,
  };
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

  // Apply aggregation to each group
  groups.forEach(group => {
    group.activities = aggregateConsecutiveActivities(group.activities as Activity[]);
  });

  return groups;
}

export function getGoal(activity: Activity) {
  const content = match(activity.action)
    .with("goal_archived", () => activity.content as api.ActivityContentGoalArchived)
    .with("goal_check_in", () => activity.content as api.ActivityContentGoalCheckIn)
    .with("goal_check_in_acknowledgement", () => activity.content as api.ActivityContentGoalCheckInAcknowledgement)
    .with("goal_closing", () => activity.content as api.ActivityContentGoalClosing)
    .with("goal_created", () => activity.content as api.ActivityContentGoalCreated)
    .with("goal_discussion_creation", () => activity.content as api.ActivityContentGoalDiscussionCreation)
    .with("goal_editing", () => activity.content as api.ActivityContentGoalEditing)
    .with("goal_reopening", () => activity.content as api.ActivityContentGoalReopening)
    .with("goal_timeframe_editing", () => activity.content as api.ActivityContentGoalTimeframeEditing)
    .otherwise(() => {
      throw new Error("Goal not available for activity action: " + activity);
    });

  return content.goal!;
}
