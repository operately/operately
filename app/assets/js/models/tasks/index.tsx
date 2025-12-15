import { Task as BackendTask, TaskStatus } from "@/api";
import { parseContextualDate } from "../contextualDates";
import { Paths } from "@/routes/paths";
import { parseMilestoneForTurboUi } from "../milestones";
import * as Activities from "@/models/activities";
import * as Comments from "@/models/comments";
import { parseActivitiesForTurboUi } from "@/models/activities/feed";
import { parseContent, richContentToString } from "turboui";
import { StatusSelector, TaskBoard, TaskPage } from "turboui";

export type { Task, EditMilestoneOrderingStateInput } from "@/api";
export { useTasksForTurboUi } from "./useTasksForTurboUi";
export { useSpaceTasksForTurboUi } from "./useSpaceTasksForTurboUi";
export { useTaskAssigneeSearch } from "./useTaskAssigneeSearch";
export { useKanbanState } from "./useKanbanState";
export { parseKanbanState, type KanbanState } from "./parseKanbanState"

export { getTask, getTasks, useGetTasks } from "@/api";

/**
 * Parses backend Task objects to the format expected by TurboUI TaskBoard
 *
 * @param paths - Paths helper for generating links
 * @param tasks - Array of backend Task objects
 * @returns Array of TurboUI Task objects
 */
export function parseTasksForTurboUi(paths: Paths, tasks: BackendTask[], type: "project" | "space"): TaskBoard.Task[] {
  return tasks.map((task) => parseTaskForTurboUi(paths, task, type));
}

export function parseTaskForTurboUi(paths: Paths, task: BackendTask, type: "project" | "space"): TaskBoard.Task {
  const description = parseContent(task.description || "{}");
  const commentCount = task.commentsCount || 0;
  const hasComments = commentCount > 0;

  return {
    id: task.id,
    title: task.name,
    status: parseTaskStatusForTurboUi(task.status),
    description: task.description || null,
    link: paths.taskPath(task.id),
    assignees: task.assignees || [],
    milestone: task.milestone ? parseMilestoneForTurboUi(paths, task.milestone) : null,
    dueDate: parseContextualDate(task.dueDate),
    hasDescription: richContentToString(description).trim().length > 0,
    hasComments,
    commentCount,
    comments: undefined,
    type,
  };
}

export function serializeTaskStatuses(statuses: StatusSelector.StatusOption[] | null | undefined): TaskStatus[] {
  if (!statuses || statuses.length === 0) return [];

  return statuses
    .map((status) => serializeTaskStatus(status))
    .filter((status): status is TaskStatus => status !== null);
}

/**
 * Serializes a TurboUI StatusSelector.StatusOption to a backend ProjectTaskStatus
 */
export function serializeTaskStatus(status: StatusSelector.StatusOption | null | undefined): TaskStatus | null {
  if (!status) return null;

  return {
    id: status.id,
    label: status.label,
    color: status.color,
    index: status.index,
    value: status.value,
    closed: status.closed ?? false,
  };
}

export function parseTaskStatusesForTurboUi(
  backend: TaskStatus[] | null | undefined,
): StatusSelector.StatusOption[] {
  if (!backend || backend.length === 0) return [];

  return backend
    .slice()
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((status) => parseTaskStatusForTurboUi(status))
    .filter((status) => status !== null) as StatusSelector.StatusOption[];
}

export function parseTaskStatusForTurboUi(
  status: TaskStatus | null | undefined,
): StatusSelector.StatusOption | null {
  if (!status) return null;

  return {
    ...status,
    icon: mapProjectTaskStatusColorToUi(status.color),
  };
}

function mapProjectTaskStatusColorToUi(color: string | null | undefined): StatusSelector.StatusOption["icon"] {
  const normalizedColor = (color ?? "gray") as StatusSelector.StatusOption["color"];

  switch (normalizedColor) {
    case "blue":
      return "circleDot";
    case "green":
      return "circleCheck";
    case "red":
      return "circleX";
    case "gray":
    default:
      return "circleDashed";
  }
}

export function prepareTaskTimelineItems(paths: Paths, activities: Activities.Activity[], comments: Comments.Comment[]) {
  const parsedActivities = parseActivitiesForTurboUi(paths, activities, "task").map((activity) => ({
    type: "task-activity",
    value: activity,
  }));
  const parsedComments = Comments.parseCommentsForTurboUi(paths, comments).map((comment) => ({
    type: "comment",
    value: comment,
  }));

  const timelineItems = [...parsedActivities, ...parsedComments] as TaskPage.TimelineItemType[];

  timelineItems.sort((a, b) => {
    const aIsTemp = a.value.id.startsWith("temp-");
    const bIsTemp = b.value.id.startsWith("temp-");

    if (aIsTemp && !bIsTemp) return 1;
    if (!aIsTemp && bIsTemp) return -1;

    const aInsertedAt = a.type === "acknowledgment" ? a.insertedAt : a.value.insertedAt;
    const bInsertedAt = b.type === "acknowledgment" ? b.insertedAt : b.value.insertedAt;

    return aInsertedAt.localeCompare(bInsertedAt);
  });

  return timelineItems;
}
