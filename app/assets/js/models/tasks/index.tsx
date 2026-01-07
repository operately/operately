import { Task as BackendTask, TaskStatus } from "@/api";
import { parseContextualDate } from "../contextualDates";
import { Paths } from "@/routes/paths";
import { parseMilestoneForTurboUi } from "../milestones";
import { parseContent, richContentToString } from "turboui";
import { StatusSelector, TaskBoard } from "turboui";
import { parsePeopleForTurboUi } from "../people";
import { Space } from "../spaces";

export type { Task, EditMilestoneOrderingStateInput } from "@/api";
export { useProjectTasksForTurboUi } from "./useProjectTasksForTurboUi";
export { useSpaceTasksForTurboUi } from "./useSpaceTasksForTurboUi";
export { useTaskAssigneeSearch } from "./useTaskAssigneeSearch";
export { useKanbanState } from "./useKanbanState";
export { parseKanbanState, type KanbanState } from "./parseKanbanState"
export { useTaskTimelineItems } from "./useTaskTimelineItems";
export { useTaskSlideInProps } from "./useTaskSlideInProps";
export { prepareTaskTimelineItems } from "./prepareTaskTimelineItems";

export { getTask, getTasks, useGetTasks } from "@/api";

type ParserOptions = { type: "project" } | { type: "space"; space: Space };

/**
 * Parses backend Task objects to the format expected by TurboUI TaskBoard
 *
 * @param paths - Paths helper for generating links
 * @param tasks - Array of backend Task objects
 * @returns Array of TurboUI Task objects
 */
export function parseTasksForTurboUi(paths: Paths, tasks: BackendTask[], opts: ParserOptions): TaskBoard.Task[] {
  return tasks.map((task) => {
      return parseTaskForTurboUi(paths, task, opts);
  });
}

export function parseTaskForTurboUi(paths: Paths, task: BackendTask, opts: ParserOptions): TaskBoard.Task {
  const description = parseContent(task.description || "{}");
  const commentCount = task.commentsCount || 0;
  const hasComments = commentCount > 0;

  return {
    id: task.id,
    title: task.name,
    status: parseTaskStatusForTurboUi(task.status),
    description: task.description || null,
    link: opts.type === "project" ? paths.taskPath(task.id) : paths.spaceKanbanPath(opts.space.id, { taskId: task.id }),
    assignees: parsePeopleForTurboUi(paths, task.assignees || []),
    milestone: task.milestone ? parseMilestoneForTurboUi(paths, task.milestone) : null,
    dueDate: parseContextualDate(task.dueDate),
    hasDescription: richContentToString(description).trim().length > 0,
    hasComments,
    commentCount,
    comments: undefined,
    type: opts.type,
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
