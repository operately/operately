import Api, { Activity, CompaniesGetActivityInput } from "@/api";
export type { Activity, ActivityContentGoalCheckIn, ActivityContentGoalTimeframeEditing, CommentThread } from "@/api";

import * as api from "@/api";
import * as Time from "@/utils/time";
import { match } from "ts-pattern";

type FeedActivity = Activity & {
  aggregatedActivities?: Activity[];
};

// Only aggregate feed items that don't preview user-authored content. Rows with snippets
// like comments, descriptions, check-ins, or discussion bodies should remain separate.
const RESOURCE_HUB_EDIT_ACTIONS = ["resource_hub_document_edited", "resource_hub_link_edited"];

const TASK_UPDATE_ACTIONS = [
  "task_adding",
  "task_assignee_updating",
  "task_due_date_updating",
  "task_name_updating",
  "task_status_updating",
];

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
    left.author?.id === right.author?.id &&
    ((resourceHubEditAction(left.action) &&
      resourceHubEditAction(right.action) &&
      sameResourceHubEditLocation(left, right)) ||
      (sameAction(left, right) && taskUpdateAction(left.action) && sameTaskUpdateLocation(left, right)))
  );
}

function sameAction(left: Activity, right: Activity): boolean {
  return Boolean(left.action && left.action === right.action);
}

function resourceHubEditAction(action?: string | null): boolean {
  return Boolean(action && RESOURCE_HUB_EDIT_ACTIONS.includes(action));
}

function taskUpdateAction(action?: string | null): boolean {
  return Boolean(action && TASK_UPDATE_ACTIONS.includes(action));
}

function sameResourceHubEditLocation(left: Activity, right: Activity): boolean {
  const leftSpaceId = resourceHubEditSpaceId(left);
  const rightSpaceId = resourceHubEditSpaceId(right);

  return Boolean(leftSpaceId && leftSpaceId === rightSpaceId);
}

function resourceHubEditSpaceId(activity: Activity): string | undefined {
  const content = activity.content;

  return match(activity.action)
    .with("resource_hub_document_edited", () => {
      return (content as api.ActivityContentResourceHubDocumentEdited | null | undefined)?.space?.id;
    })
    .with("resource_hub_link_edited", () => {
      return (content as api.ActivityContentResourceHubLinkEdited | null | undefined)?.space?.id;
    })
    .otherwise(() => undefined);
}

function sameTaskUpdateLocation(left: Activity, right: Activity): boolean {
  const leftLocation = taskUpdateLocationKey(left);
  const rightLocation = taskUpdateLocationKey(right);

  return Boolean(leftLocation && leftLocation === rightLocation);
}

function taskUpdateLocationKey(activity: Activity): string | undefined {
  const content = taskUpdateContent(activity);
  const projectId = content?.project?.id;
  const spaceId = content?.space?.id;

  if (projectId) return `project:${projectId}`;
  if (spaceId) return `space:${spaceId}`;
  return undefined;
}

function taskUpdateContent(
  activity: Activity,
):
  | api.ActivityContentTaskAssigneeUpdating
  | api.ActivityContentTaskDueDateUpdating
  | api.ActivityContentTaskAdding
  | api.ActivityContentTaskNameUpdating
  | api.ActivityContentTaskStatusUpdating
  | undefined {
  return match(activity.action)
    .with("task_adding", () => activity.content as api.ActivityContentTaskAdding)
    .with("task_assignee_updating", () => activity.content as api.ActivityContentTaskAssigneeUpdating)
    .with("task_due_date_updating", () => activity.content as api.ActivityContentTaskDueDateUpdating)
    .with("task_name_updating", () => activity.content as api.ActivityContentTaskNameUpdating)
    .with("task_status_updating", () => activity.content as api.ActivityContentTaskStatusUpdating)
    .otherwise(() => undefined);
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
