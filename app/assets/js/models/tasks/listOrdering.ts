import { compareIds } from "@/routes/paths";

export interface ListedTask {
  id: string;
  milestoneId: string | null;
}

export interface ListedMilestone {
  id: string;
  tasksOrderingState: string[];
}

export interface TaskListGraph {
  tasks: ListedTask[];
  milestones: ListedMilestone[];
}

/**
 * Optimistic counterpart of the server list move: update the task's milestone,
 * drop it from the source list, and insert it at `destinationIndex` on the
 * destination. A null destination is the root list, which has no ordering state.
 *
 * `include` is how projects skip closed/helper tasks; templates omit it.
 */
export function applyTaskMove(
  graph: TaskListGraph,
  taskId: string,
  destinationMilestoneId: string | null,
  destinationIndex: number,
  opts?: { include?: (task: ListedTask) => boolean },
): TaskListGraph {
  if (!findTask(graph.tasks, taskId)) return graph;

  const include = opts?.include ?? includeAll;
  const tasks = assignMilestone(graph.tasks, taskId, destinationMilestoneId);
  const moved = findTask(tasks, taskId);
  const listMovedTask = Boolean(moved && include(moved));

  const milestones = graph.milestones.map((milestone) => ({
    ...milestone,
    tasksOrderingState: nextOrdering(milestone, tasks, {
      taskId,
      destinationMilestoneId,
      destinationIndex,
      include,
      listMovedTask,
    }),
  }));

  return { tasks, milestones };
}

function nextOrdering(
  milestone: ListedMilestone,
  tasks: ListedTask[],
  move: {
    taskId: string;
    destinationMilestoneId: string | null;
    destinationIndex: number;
    include: (task: ListedTask) => boolean;
    listMovedTask: boolean;
  },
) {
  const members = tasksOnMilestone(tasks, milestone.id, move.include);
  const ordering = syncOrdering(milestone.tasksOrderingState, members);
  const isDestination = Boolean(move.destinationMilestoneId && compareIds(milestone.id, move.destinationMilestoneId));

  if (isDestination && move.listMovedTask) {
    return insertId(ordering, move.taskId, move.destinationIndex);
  }

  return removeId(ordering, move.taskId);
}

function assignMilestone(tasks: ListedTask[], taskId: string, milestoneId: string | null) {
  return tasks.map((task) => (compareIds(task.id, taskId) ? { ...task, milestoneId } : task));
}

function tasksOnMilestone(tasks: ListedTask[], milestoneId: string, include: (task: ListedTask) => boolean) {
  return tasks.filter((task) => compareIds(task.milestoneId, milestoneId) && include(task));
}

/** Keep stored order for current members, then append anyone missing. */
function syncOrdering(stored: string[] | undefined, members: ListedTask[]) {
  const kept = (stored ?? []).filter((id) => members.some((task) => compareIds(task.id, id)));
  const missing = members.filter((task) => !kept.some((id) => compareIds(id, task.id))).map((task) => task.id);
  return [...kept, ...missing];
}

function insertId(ids: string[], taskId: string, destinationIndex: number) {
  const withoutTask = removeId(ids, taskId);
  const index = Math.min(Math.max(destinationIndex, 0), withoutTask.length);
  return [...withoutTask.slice(0, index), taskId, ...withoutTask.slice(index)];
}

function removeId(ids: string[], taskId: string) {
  return ids.filter((id) => !compareIds(id, taskId));
}

function findTask(tasks: ListedTask[], taskId: string) {
  return tasks.find((task) => compareIds(task.id, taskId));
}

function includeAll() {
  return true;
}
