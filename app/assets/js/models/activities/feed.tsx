import {
  Activity,
  ActivityContentTaskAdding,
  ActivityContentTaskAssigneeUpdating,
  ActivityContentTaskDescriptionChange,
  ActivityContentTaskDueDateUpdating,
  ActivityContentTaskMilestoneUpdating,
  ActivityContentTaskNameUpdating,
  ActivityContentTaskStatusUpdating,
} from "@/api";
import { compareIds, Paths } from "@/routes/paths";
import {
  MilestoneActivity,
  TaskAssignmentActivity,
  TaskCreationActivity,
  TaskDescriptionActivity,
  TaskDueDateActivity,
  TaskMilestoneActivity,
  TaskStatusChangeActivity,
  TaskTitleActivity,
} from "turboui";
import { parseContextualDate } from "../contextualDates";
import { parseMilestoneForTurboUi } from "../milestones";
import { parsePersonForTurboUi } from "../people";
import * as Tasks from "../tasks";

export const TASK_ACTIVITY_TYPES = [
  "task_adding",
  "task_name_updating",
  "task_description_change",
  "task_assignee_updating",
  "task_due_date_updating",
  "task_milestone_updating",
  "task_status_updating",
];

export const MILESTONE_ACTIVITY_TYPES = [
  "task_adding",
  "project_milestone_creation",
  "milestone_description_updating",
  "milestone_title_updating",
  "milestone_due_date_updating",
];

type PageContext = "task" | "milestone";

const SUPPORTED_ACTIVITY_TYPES_BY_CONTEXT: Record<PageContext, string[]> = {
  task: TASK_ACTIVITY_TYPES,
  milestone: MILESTONE_ACTIVITY_TYPES,
};

type TurboUiPerson = NonNullable<ReturnType<typeof parsePersonForTurboUi>>;

export function parseActivitiesForTurboUi(paths: Paths, activities: Activity[], pageContext: PageContext) {
  const supportedActivityTypes = SUPPORTED_ACTIVITY_TYPES_BY_CONTEXT[pageContext];

  return activities
    .filter((activity) => supportedActivityTypes.includes(activity.action))
    .map((activity) => parseActivityForTurboUi(paths, activity, pageContext))
    .filter((activity) => activity !== null);
}

function parseActivityForTurboUi(paths: Paths, activity: Activity, pageContext: PageContext) {
  const author = parsePersonForTurboUi(paths, activity.author);

  switch (activity.action) {
    case "task_adding":
      return parseTaskCreationActivity(author!, activity, pageContext);
    case "task_name_updating":
      return parseTaskNameUpdatingActivity(
        author!,
        activity,
        activity.content as ActivityContentTaskNameUpdating,
        pageContext,
      );
    case "task_description_change":
      return parseTaskDescriptionChangeActivity(
        author!,
        activity,
        activity.content as ActivityContentTaskDescriptionChange,
        pageContext,
      );
    case "task_assignee_updating":
      return parseTaskAssigneeUpdatingActivity(
        paths,
        author!,
        activity,
        activity.content as ActivityContentTaskAssigneeUpdating,
        pageContext,
      );
    case "task_due_date_updating":
      return parseTaskDueDateUpdatingActivity(
        author!,
        activity,
        activity.content as ActivityContentTaskDueDateUpdating,
        pageContext,
      );
    case "task_milestone_updating":
      return parseTaskMilestoneUpdatingActivity(
        paths,
        author!,
        activity,
        activity.content as ActivityContentTaskMilestoneUpdating,
        pageContext,
      );
    case "task_status_updating":
      return parseTaskStatusUpdatingActivity(
        author!,
        activity,
        activity.content as ActivityContentTaskStatusUpdating,
        pageContext,
      );

    case "project_milestone_creation":
    case "milestone_description_updating":
    case "milestone_title_updating":
    case "milestone_due_date_updating":
      return parseMilestoneActivity(author!, activity);

    default:
      return null;
  }
}

function parseTaskCreationActivity(
  author: TurboUiPerson,
  activity: Activity,
  pageContext: PageContext,
): TaskCreationActivity {
  const { taskName } = activity.content as ActivityContentTaskAdding;

  return {
    id: activity.id,
    type: "task_adding",
    author,
    insertedAt: activity.insertedAt,
    taskName: taskName,
    page: pageContext,
  };
}

function parseTaskNameUpdatingActivity(
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskNameUpdating,
  pageContext: PageContext,
): TaskTitleActivity {
  return {
    id: activity.id,
    type: "task_name_updating",
    author,
    insertedAt: activity.insertedAt,
    fromTitle: content.oldName,
    toTitle: content.newName,
    page: pageContext,
  };
}

function parseTaskDescriptionChangeActivity(
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskDescriptionChange,
  pageContext: PageContext,
): TaskDescriptionActivity {
  return {
    id: activity.id,
    type: "task_description_change",
    author,
    insertedAt: activity.insertedAt,
    hasContent: content.hasDescription,
    taskName: content.task?.name || "a task",
    page: pageContext,
  };
}

function parseTaskAssigneeUpdatingActivity(
  paths: Paths,
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskAssigneeUpdating,
  pageContext: PageContext,
): TaskAssignmentActivity {
  return {
    id: activity.id,
    type: "task_assignee_updating",
    author,
    insertedAt: activity.insertedAt,
    assignee: parsePersonForTurboUi(paths, content.newAssignee || content.oldAssignee)!,
    action: content.newAssignee ? "assigned" : "unassigned",
    taskName: content.task?.name || "a task",
    page: pageContext,
  };
}

function parseTaskDueDateUpdatingActivity(
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskDueDateUpdating,
  pageContext: PageContext,
): TaskDueDateActivity {
  return {
    id: activity.id,
    type: "task_due_date_updating",
    author,
    insertedAt: activity.insertedAt,
    fromDueDate: parseContextualDate(content.oldDueDate),
    toDueDate: parseContextualDate(content.newDueDate),
    taskName: content.taskName || "",
    page: pageContext,
  };
}

function parseTaskMilestoneUpdatingActivity(
  paths: Paths,
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskMilestoneUpdating,
  pageContext: PageContext,
): TaskMilestoneActivity | null {
  if (compareIds(content.newMilestone?.id, content.oldMilestone?.id)) {
    return null;
  }

  // If both milestones are null (deleted), we cannot display this activity
  if (!content.newMilestone && !content.oldMilestone) {
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
    taskName: content.task?.name || "",
    page: pageContext,
  };
}

function parseTaskStatusUpdatingActivity(
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskStatusUpdating,
  pageContext: PageContext,
): TaskStatusChangeActivity {
  return {
    id: activity.id,
    type: "task_status_updating",
    author,
    insertedAt: activity.insertedAt,
    fromStatus: Tasks.parseTaskStatusForTurboUi(content.oldStatus),
    toStatus: Tasks.parseTaskStatusForTurboUi(content.newStatus),
    taskName: content.name || "",
    page: pageContext,
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
