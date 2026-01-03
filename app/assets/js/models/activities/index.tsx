import Api, { Activity, GetActivityInput } from "@/api";
export type { Activity, ActivityContentGoalCheckIn, ActivityContentGoalTimeframeEditing, CommentThread } from "@/api";

import * as api from "@/api";
import * as Time from "@/utils/time";
import { match } from "ts-pattern";

export const getActivity = async (input: GetActivityInput) => {
  const response = await Api.getActivity(input);
  return response.activity!;
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

export function getProject(activity: Activity) {
  const content = match(activity.action)
    .with("project_resuming", () => activity.content as api.ActivityContentProjectResuming)
    .otherwise(() => {
      throw new Error("Project not available for activity action: " + activity.action);
    });

  if (!content.project) {
    throw new Error("Project not available for activity action: " + activity.action);
  }

  return content.project;
}
