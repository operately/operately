import {
  Activity,
  ActivityContentTaskNameUpdating,
  ActivityContentTaskAssigneeUpdating,
  ActivityContentTaskDueDateUpdating,
  ActivityContentTaskMilestoneUpdating,
  ActivityContentTaskStatusUpdating,
} from "@/api";
import {
  TaskCreationActivity,
  TaskTitleActivity,
  TaskDescriptionActivity,
  TaskAssignmentActivity,
  TaskDueDateActivity,
  TaskMilestoneActivity,
  TaskStatusChangeActivity,
} from "turboui";
import { parsePersonForTurboUi } from "../people";
import { compareIds, Paths } from "@/routes/paths";
import { parseContextualDate } from "../contextualDates";
import { parseMilestoneForTurboUi } from "../milestones";
import { parseTaskStatus } from "../tasks";

export const SUPPORTED_ACTIVITY_TYPES = [
  "task_adding",
  "task_name_updating",
  "task_description_change",
  "task_assignee_updating",
  "task_due_date_updating",
  "task_milestone_updating",
  "task_status_updating",
];

type TurboUiPerson = NonNullable<ReturnType<typeof parsePersonForTurboUi>>;

export function parseActivitiesForTurboUi(paths: Paths, activities: Activity[]) {
  return activities
    .filter((activity) => SUPPORTED_ACTIVITY_TYPES.includes(activity.action))
    .map((activity) => parseActivityForTurboUi(paths, activity))
    .filter((activity) => activity !== null);
}

function parseActivityForTurboUi(paths: Paths, activity: Activity) {
  const author = parsePersonForTurboUi(paths, activity.author);

  switch (activity.action) {
    case "task_adding":
      return parseTaskCreationActivity(author!, activity);
    case "task_name_updating":
      return parseTaskNameUpdatingActivity(author!, activity, activity.content as ActivityContentTaskNameUpdating);
    case "task_description_change":
      return parseTaskDescriptionChangeActivity(author!, activity);
    case "task_assignee_updating":
      return parseTaskAssigneeUpdatingActivity(
        paths,
        author!,
        activity,
        activity.content as ActivityContentTaskAssigneeUpdating,
      );
    case "task_due_date_updating":
      return parseTaskDueDateUpdatingActivity(
        author!,
        activity,
        activity.content as ActivityContentTaskDueDateUpdating,
      );
    case "task_milestone_updating":
      return parseTaskMilestoneUpdatingActivity(
        paths,
        author!,
        activity,
        activity.content as ActivityContentTaskMilestoneUpdating,
      );
    case "task_status_updating":
      return parseTaskStatusUpdatingActivity(author!, activity, activity.content as ActivityContentTaskStatusUpdating);
    default:
      return null;
  }
}

function parseTaskCreationActivity(author: TurboUiPerson, activity: Activity): TaskCreationActivity {
  return {
    id: activity.id,
    type: "task_adding",
    author,
    insertedAt: activity.insertedAt,
  };
}

function parseTaskNameUpdatingActivity(
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskNameUpdating,
): TaskTitleActivity {
  return {
    id: activity.id,
    type: "task_name_updating",
    author,
    insertedAt: activity.insertedAt,
    fromTitle: content.oldName,
    toTitle: content.newName,
  };
}

function parseTaskDescriptionChangeActivity(author: TurboUiPerson, activity: Activity): TaskDescriptionActivity {
  return {
    id: activity.id,
    type: "task_description_change",
    author,
    insertedAt: activity.insertedAt,
    hasContent: true,
  };
}

function parseTaskAssigneeUpdatingActivity(
  paths: Paths,
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskAssigneeUpdating,
): TaskAssignmentActivity {
  return {
    id: activity.id,
    type: "task_assignee_updating",
    author,
    insertedAt: activity.insertedAt,
    assignee: parsePersonForTurboUi(paths, content.newAssignee || content.oldAssignee)!,
    action: content.newAssignee ? "assigned" : "unassigned",
  };
}

function parseTaskDueDateUpdatingActivity(
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskDueDateUpdating,
): TaskDueDateActivity {
  return {
    id: activity.id,
    type: "task_due_date_updating",
    author,
    insertedAt: activity.insertedAt,
    fromDueDate: parseContextualDate(content.oldDueDate),
    toDueDate: parseContextualDate(content.newDueDate),
  };
}

function parseTaskMilestoneUpdatingActivity(
  paths: Paths,
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskMilestoneUpdating,
): TaskMilestoneActivity | null {
  if (compareIds(content.newMilestone?.id, content.oldMilestone?.id)) {
    return null;
  }

  return {
    id: activity.id,
    type: "task_milestone_updating",
    author,
    insertedAt: activity.insertedAt,
    milestone: content.newMilestone
      ? parseMilestoneForTurboUi(paths, content.newMilestone)
      : parseMilestoneForTurboUi(paths, content.oldMilestone!),
    action: content.newMilestone ? "attached" : "detached",
  };
}

function parseTaskStatusUpdatingActivity(
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskStatusUpdating,
): TaskStatusChangeActivity {
  return {
    id: activity.id,
    type: "task_status_updating",
    author,
    insertedAt: activity.insertedAt,
    fromStatus: parseTaskStatus(content.oldStatus),
    toStatus: parseTaskStatus(content.newStatus),
  };
}
