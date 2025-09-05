import * as Types from "../types";
import { compareIds, includesId } from "../../utils/ids";

export function sortTasks(tasks: Types.Task[], milestone: Types.Milestone) {
  if (!milestone.tasksOrderingState || milestone.tasksOrderingState.length === 0) {
    return tasks;
  }

  const orderingState = milestone.tasksOrderingState;
  const tasksInOrder: Types.Task[] = [];
  const tasksNotInOrder: Types.Task[] = [];

  // First, add tasks in the order specified by tasksOrderingState
  orderingState.forEach((taskId) => {
    const task = tasks.find((t) => compareIds(t.id, taskId));
    if (task) {
      tasksInOrder.push(task);
    }
  });

  // Then, add any tasks that aren't in the ordering state at the end
  tasks.forEach((task) => {
    if (!includesId(orderingState, task.id)) {
      tasksNotInOrder.push(task);
    }
  });

  return [...tasksInOrder, ...tasksNotInOrder];
}
