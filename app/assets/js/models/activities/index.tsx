import Api, { Activity, CompaniesGetActivityInput } from "@/api";
export type { Activity, ActivityContentGoalCheckIn, ActivityContentGoalTimeframeEditing, CommentThread } from "@/api";

import * as api from "@/api";
import * as Time from "@/utils/time";
import { match } from "ts-pattern";

export type FeedActivity = Activity & {
  aggregatedActivities?: Activity[];
};

const AGGREGATABLE_ACTIONS = ["resource_hub_document_edited"];

export const getActivity = async (input: CompaniesGetActivityInput) => {
  const response = await Api.companies.getActivity(input);
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

export function aggregateConsecutiveFeedActivities(activities: Activity[]): FeedActivity[] {
  const result: FeedActivity[] = [];

  for (const activity of activities) {
    const last = result[result.length - 1];

    if (last && canAggregate(last, activity)) {
      const aggregatedActivities = [...getAggregatedActivities(last), activity];
      const insertedAt = earliestInsertedAt(aggregatedActivities);

      result[result.length - 1] = {
        ...last,
        ...(insertedAt ? { insertedAt } : {}),
        aggregatedActivities,
      };
    } else {
      result.push(activity);
    }
  }

  return result;
}

export function getAggregatedActivities(activity: FeedActivity): Activity[] {
  return activity.aggregatedActivities || [activity];
}

function canAggregate(left: FeedActivity, right: Activity): boolean {
  return (
    aggregatableAction(left.action) &&
    left.action === right.action &&
    left.author?.id === right.author?.id &&
    sameActivityLocation(left, right)
  );
}

function aggregatableAction(action?: string | null): boolean {
  return Boolean(action && AGGREGATABLE_ACTIONS.includes(action));
}

function sameActivityLocation(left: Activity, right: Activity): boolean {
  const leftContent = left.content as api.ActivityContentResourceHubDocumentEdited | null | undefined;
  const rightContent = right.content as api.ActivityContentResourceHubDocumentEdited | null | undefined;

  return leftContent?.space?.id === rightContent?.space?.id;
}

function earliestInsertedAt(activities: Activity[]): string | undefined {
  return activities.reduce<string | undefined>((earliest, activity) => {
    if (!activity.insertedAt) return earliest;
    if (!earliest) return activity.insertedAt;

    return activity.insertedAt < earliest ? activity.insertedAt : earliest;
  }, undefined);
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
