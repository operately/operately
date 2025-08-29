import {
  Activity,
  ActivityContentTaskNameUpdating,
  ActivityContentTaskAssigneeUpdating,
  ActivityContentTaskDueDateUpdating,
  ActivityContentTaskMilestoneUpdating,
  ActivityContentTaskStatusUpdating,
  ActivityContentTaskDescriptionChange,
} from "@/api";
import {
  TaskCreationActivity,
  TaskTitleActivity,
  TaskDescriptionActivity,
  TaskAssignmentActivity,
  TaskDueDateActivity,
  TaskMilestoneActivity,
  TaskStatusChangeActivity,
  MilestoneActivity,
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
  "project_milestone_creation",
  "milestone_description_updating",
  "milestone_title_updating",
  "milestone_due_date_updating",
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
      return parseTaskDescriptionChangeActivity(
        author!,
        activity,
        activity.content as ActivityContentTaskDescriptionChange,
      );
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

    case "project_milestone_creation":
    case "milestone_description_updating":
    case "milestone_title_updating":
    case "milestone_due_date_updating":
      return parseMilestoneActivity(author!, activity);

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

function parseTaskDescriptionChangeActivity(
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskDescriptionChange,
): TaskDescriptionActivity {
  return {
    id: activity.id,
    type: "task_description_change",
    author,
    insertedAt: activity.insertedAt,
    hasContent: content.hasDescription,
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

function parseMilestoneActivity(author: TurboUiPerson, activity: Activity): MilestoneActivity | null {
  try {
    const type = findMilestoneActivityType(activity.action);

    return {
      id: activity.id,
      type,
      author,
      insertedAt: activity.insertedAt,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

function findMilestoneActivityType(action: string): MilestoneActivity["type"] {
  switch (action) {
    case "project_milestone_creation":
      return "project_milestone_creation";
    case "milestone_description_updating":
      return "milestone_description_updating";
    case "milestone_title_updating":
    case "milestone_due_date_updating":
      return "milestone_update";
    default:
      throw new Error(`Invalid milestone activity action: ${action}`);
  }
}
