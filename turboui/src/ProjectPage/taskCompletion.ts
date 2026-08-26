import type { ProjectPageLayout } from "../ProjectPageLayout";
import * as TaskBoardTypes from "../TaskBoard/types";

export function getTaskCompletionStats(tasks: TaskBoardTypes.Task[]): ProjectPageLayout.TaskCompletionStats | null {
  const trackedTasks = tasks.filter(isTrackedTask);
  const totalCount = trackedTasks.length;

  if (totalCount === 0) {
    return null;
  }

  const completedCount = trackedTasks.filter(isCompletedTask).length;

  return {
    completedCount,
    totalCount,
    percentage: Math.round((completedCount / totalCount) * 100),
  };
}

function isTrackedTask(task: TaskBoardTypes.Task) {
  if (task._isHelperTask || isCanceledTask(task)) {
    return false;
  }

  return isCompletedTask(task) || task.milestone?.status !== "done";
}

function isCanceledTask(task: TaskBoardTypes.Task) {
  return Boolean(task.status?.closed && task.status.color === "red") || task.status?.value === "canceled";
}

function isCompletedTask(task: TaskBoardTypes.Task) {
  if (!task.status) {
    return false;
  }

  return (
    task.status.value === "done" ||
    task.status.value === "completed" ||
    Boolean(task.status.closed && task.status.color === "green")
  );
}
