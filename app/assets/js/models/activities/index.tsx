import { Activity } from "@/api";
export { useDeleteFeedActivity } from "./activityLifecycle";
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
    sameActivityDay(left, right) &&
    ((resourceHubEditAction(left.action) &&
      resourceHubEditAction(right.action) &&
      sameResourceHubEditLocation(left, right)) ||
      (sameAction(left, right) && taskUpdateAction(left.action) && sameTaskUpdateLocation(left, right)) ||
      (sameAction(left, right) && sameCompactUpdateContext(left, right)))
  );
}

function sameActivityDay(left: Activity, right: Activity): boolean {
  if (!left.insertedAt || !right.insertedAt) return false;

  return Time.isSameDay(Time.parseISO(left.insertedAt), Time.parseISO(right.insertedAt));
}

// Context keys are explicit per operation: a shared location alone is not enough
// to describe movement, assignment transitions, or archive/restore accurately.
function sameCompactUpdateContext(left: Activity, right: Activity): boolean {
  if (!left.author?.id || !right.author?.id) return false;
  const leftKey = compactUpdateContext(left);
  return leftKey !== undefined && leftKey === compactUpdateContext(right);
}

function locationKey(content: { project?: api.Project | null; space?: api.Space | null } | null | undefined) {
  if (content?.project) return content.project.id ? `project:${content.project.id}` : undefined;
  if (content?.space?.id) return `space:${content.space.id}`;
  return undefined;
}

function compactUpdateContext(activity: Activity): string | undefined {
  switch (activity.action) {
    case "task_deleting":
      return locationKey(activity.content as api.ActivityContentTaskDeleting);
    case "task_archive_updating": {
      const content = activity.content as api.ActivityContentTaskArchiveUpdating | undefined;
      const location = locationKey(content);
      return location && typeof content?.archived === "boolean" ? `${location}:${content.archived}` : undefined;
    }
    case "task_moving": {
      const content = activity.content as api.ActivityContentTaskMoving | undefined;
      if (!content) return undefined;
      const origin =
        content.originType === "project"
          ? content.originProject?.id
          : content.originType === "space"
            ? content.originSpace?.id
            : undefined;
      const destination =
        content.destinationType === "project"
          ? content.destinationProject?.id
          : content.destinationType === "space"
            ? content.destinationSpace?.id
            : undefined;
      return origin && destination
        ? JSON.stringify([content.originType, origin, content.destinationType, destination])
        : undefined;
    }
    case "task_milestone_updating": {
      const content = activity.content as api.ActivityContentTaskMilestoneUpdating | undefined;
      if (!content?.project?.id) return undefined;
      const oldId = content.oldMilestone === null ? null : content.oldMilestone?.id;
      const newId = content.newMilestone === null ? null : content.newMilestone?.id;
      if ((oldId !== null && !oldId) || (newId !== null && !newId)) return undefined;
      return JSON.stringify([content.project.id, oldId, newId]);
    }
    case "project_milestone_commented": {
      if (!isBodylessMilestoneLifecycle(activity)) return undefined;
      const content = activity.content as api.ActivityContentProjectMilestoneCommented;
      return content.project?.id ? JSON.stringify([content.project.id, content.commentAction]) : undefined;
    }
    case "project_milestone_creation":
    case "project_milestone_updating":
    case "milestone_title_updating":
    case "milestone_due_date_updating":
    case "milestone_deleting":
      return (activity.content as api.ActivityContentProjectMilestoneCreation | undefined)?.project?.id || undefined;
    default:
      return undefined;
  }
}

export function isBodylessMilestoneLifecycle(activity: Activity): boolean {
  if (activity.action !== "project_milestone_commented") return false;
  const content = activity.content as api.ActivityContentProjectMilestoneCommented | undefined;
  if (content?.commentAction !== "complete" && content?.commentAction !== "reopen") return false;
  const body: unknown = content.comment?.content;
  if (body === undefined || body === null) return true;
  if (typeof body !== "string") return false;
  if (body.trim() === "") return true;
  try {
    const parsed: unknown = JSON.parse(body);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length === 0;
  } catch {
    return false;
  }
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
    .with("project_pausing", () => activity.content as api.ActivityContentProjectPausing)
    .otherwise(() => {
      throw new Error("Project not available for activity action: " + activity.action);
    });

  if (!content.project) {
    throw new Error("Project not available for activity action: " + activity.action);
  }

  return content.project;
}
