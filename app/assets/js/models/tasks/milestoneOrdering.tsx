import { TaskBoard } from "turboui";

import { EditMilestoneOrderingStateInput } from "@/api";
import { compareIds, includesId } from "@/routes/paths";

/**
 * Builds milestone ordering state arrays for the task milestone update mutation
 *
 * @param tasks - List of all tasks in the board
 * @param milestones - List of all milestones with their current ordering states
 * @param task - The task being moved
 * @param targetMilestoneId - ID of the milestone where the task is being moved to
 * @param indexInTargetMilestone - Position in the target milestone
 * @returns Array of milestone ordering states that need to be updated
 */
export const buildMilestonesOrderingState = (
  tasks: TaskBoard.Task[],
  milestones: TaskBoard.Milestone[],
  task: TaskBoard.Task,
  targetMilestoneId: string | null,
  indexInTargetMilestone: number,
): EditMilestoneOrderingStateInput[] => {
  const sourceMilestoneId = task.milestone?.id || null;
  const shouldIncludeTask = isTaskVisible(task);

  const orderingUpdates: EditMilestoneOrderingStateInput[] = [];
  const sameMilestone = sourceMilestoneId && targetMilestoneId && compareIds(sourceMilestoneId, targetMilestoneId);

  if (sameMilestone && sourceMilestoneId) {
    const milestone = findMilestone(milestones, sourceMilestoneId);
    if (!milestone) return orderingUpdates;

    const visibleTaskIds = collectVisibleTaskIds(tasks, milestone.id, task, targetMilestoneId);
    const normalizedOrdering = normalizeOrderingState(milestone.tasksOrderingState, visibleTaskIds);
    const nextOrdering = shouldIncludeTask
      ? moveTaskId(normalizedOrdering, task.id, indexInTargetMilestone)
      : normalizedOrdering;

    orderingUpdates.push({
      milestoneId: milestone.id,
      orderingState: nextOrdering,
    });

    return orderingUpdates;
  }

  if (sourceMilestoneId) {
    const sourceMilestone = findMilestone(milestones, sourceMilestoneId);
    if (sourceMilestone) {
      const visibleTaskIds = collectVisibleTaskIds(tasks, sourceMilestone.id, task, targetMilestoneId);
      const normalizedOrdering = normalizeOrderingState(sourceMilestone.tasksOrderingState, visibleTaskIds);
      const nextOrdering = normalizedOrdering.filter((id) => !compareIds(id, task.id));

      orderingUpdates.push({
        milestoneId: sourceMilestone.id,
        orderingState: nextOrdering,
      });
    }
  }

  if (targetMilestoneId) {
    const targetMilestone = findMilestone(milestones, targetMilestoneId);
    if (targetMilestone) {
      const visibleTaskIds = collectVisibleTaskIds(tasks, targetMilestone.id, task, targetMilestoneId);
      const normalizedOrdering = normalizeOrderingState(targetMilestone.tasksOrderingState, visibleTaskIds);
      const nextOrdering = shouldIncludeTask
        ? moveTaskId(normalizedOrdering, task.id, indexInTargetMilestone)
        : normalizedOrdering;

      orderingUpdates.push({
        milestoneId: targetMilestone.id,
        orderingState: nextOrdering,
      });
    }
  }

  return orderingUpdates;
};

export const normalizeMilestonesOrderingState = (
  milestones: TaskBoard.Milestone[],
  tasks: TaskBoard.Task[],
): TaskBoard.Milestone[] => {
  let changed = false;

  const nextMilestones = milestones.map((milestone) => {
    const visibleTaskIds = collectVisibleTaskIds(tasks, milestone.id, null, null);
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

function isTaskVisible(task: TaskBoard.Task) {
  if (task._isHelperTask) return false;
  if (task.status?.closed) return false;
  return true;
}

function collectVisibleTaskIds(
  tasks: TaskBoard.Task[],
  milestoneId: string,
  movedTask: TaskBoard.Task | null,
  targetMilestoneId: string | null,
) {
  const ids: string[] = [];

  tasks.forEach((task) => {
    if (!isTaskVisible(task)) return;

    const taskMilestoneId = resolveTaskMilestoneId(task, movedTask, targetMilestoneId);
    if (compareIds(taskMilestoneId, milestoneId)) {
      ids.push(task.id);
    }
  });

  return ids;
}

function resolveTaskMilestoneId(
  task: TaskBoard.Task,
  movedTask: TaskBoard.Task | null,
  targetMilestoneId: string | null,
) {
  if (movedTask && compareIds(task.id, movedTask.id)) {
    return targetMilestoneId;
  }

  return task.milestone?.id || null;
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

function moveTaskId(orderingState: string[], taskId: string, destinationIndex: number) {
  const withoutTask = orderingState.filter((id) => !compareIds(id, taskId));
  const boundedIndex = Math.min(Math.max(destinationIndex, 0), withoutTask.length);
  const nextOrdering = withoutTask.slice();

  nextOrdering.splice(boundedIndex, 0, taskId);

  return nextOrdering;
}

function findMilestone(milestones: TaskBoard.Milestone[], milestoneId: string) {
  return milestones.find((milestone) => compareIds(milestone.id, milestoneId)) || null;
}
