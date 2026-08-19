import { TaskBoard } from "turboui";

import { compareIds, includesId } from "@/routes/paths";

export const normalizeMilestonesOrderingState = (
  milestones: TaskBoard.Milestone[],
  tasks: TaskBoard.Task[],
): TaskBoard.Milestone[] => {
  let changed = false;

  const nextMilestones = milestones.map((milestone) => {
    const visibleTaskIds = collectVisibleTaskIds(tasks, milestone.id);
    const normalizedOrdering = normalizeOrderingState(milestone.tasksOrderingState, visibleTaskIds);
    const currentOrdering = milestone.tasksOrderingState || [];

    if (orderingStatesEqual(normalizedOrdering, currentOrdering)) {
      return milestone;
    }

    changed = true;
    return {
      ...milestone,
      tasksOrderingState: normalizedOrdering,
    };
  });

  return changed ? nextMilestones : milestones;
};

export function isTaskVisible(task: TaskBoard.Task) {
  if (task._isHelperTask) return false;
  if (task.status?.closed) return false;
  return true;
}

function collectVisibleTaskIds(tasks: TaskBoard.Task[], milestoneId: string) {
  return tasks.flatMap((task) =>
    isTaskVisible(task) && compareIds(task.milestone?.id || null, milestoneId) ? [task.id] : [],
  );
}

function normalizeOrderingState(orderingState: string[] | undefined, visibleTaskIds: string[]) {
  const normalized: string[] = [];
  const seen: string[] = [];

  (orderingState || []).forEach((id) => {
    if (!includesId(visibleTaskIds, id)) return;
    if (includesId(seen, id)) return;

    normalized.push(id);
    seen.push(id);
  });

  visibleTaskIds.forEach((id) => {
    if (includesId(seen, id)) return;

    normalized.push(id);
    seen.push(id);
  });

  return normalized;
}

function orderingStatesEqual(a: string[], b: string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i += 1) {
    if (!compareIds(a[i], b[i])) return false;
  }

  return true;
}
