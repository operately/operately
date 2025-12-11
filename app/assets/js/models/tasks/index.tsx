import { Task as BackendTask, TaskStatus } from "@/api";
import { parseContextualDate } from "../contextualDates";
import { Paths } from "@/routes/paths";
import { parseMilestoneForTurboUi } from "../milestones";
import { parseContent, richContentToString } from "turboui";
import { StatusSelector, TaskBoard } from "turboui";

export type { Task, EditMilestoneOrderingStateInput } from "@/api";
export { useTasksForTurboUi } from "./useTasksForTurboUi";
export { useTaskAssigneeSearch } from "./useTaskAssigneeSearch";
export { useMilestoneKanbanState } from "./useMilestoneKanbanState";
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
