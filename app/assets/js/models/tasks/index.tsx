import { Task as BackendTask } from "@/api";
import { parseContextualDate } from "../contextualDates";
import { Paths } from "@/routes/paths";
import { parseMilestoneForTurboUi } from "../milestones";
import { Status } from "turboui/src/TaskBoard/types";

export type { Task } from "@/api";

export {
  getTask,
  getTasks,
  useGetTasks,
  useUpdateTaskStatus,
  useCreateTask,
  useUpdateTask,
  useChangeTaskDescription,
} from "@/api";

/**
 * Parses backend Task objects to the format expected by TurboUI TaskBoard
 *
 * @param paths - Paths helper for generating links
 * @param tasks - Array of backend Task objects
 * @returns Array of TurboUI Task objects
 */
export function parseTasksForTurboUi(paths: Paths, tasks: BackendTask[]) {
  return tasks.map((task) => parseTaskForTurboUi(paths, task));
}

export function parseTaskForTurboUi(paths: Paths, task: BackendTask) {
  return {
    id: task.id,
    title: task.name,
    status: parseTaskStatus(task.status),
    description: task.description || null,
    link: paths.taskPath(task.id),
    assignees: task.assignees || [],
    milestone: task.milestone ? parseMilestoneForTurboUi(paths, task.milestone) : null,
    dueDate: parseContextualDate(task.dueDate),
    hasDescription: !!task.description,
    hasComments: false,
    commentCount: 0,
    comments: undefined,
  };
}

function parseTaskStatus(status: string | null | undefined): Status {
  const validStatuses: Status[] = ["pending", "in_progress", "done", "canceled"];

  if (status && validStatuses.includes(status as Status)) {
    return status as Status;
  }

  return "pending";
}
