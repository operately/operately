import type { WorkMap } from "../WorkMap";
import { sortTasksByDueDateAndAssignmentDate } from "../WorkMap/utils/sort";
import { idWithoutComments } from "../utils/ids";

export function sortPersonalTasks(tasks: WorkMap.Item[], ordering: string[]): WorkMap.Item[] {
  const remaining = new Map(
    sortTasksByDueDateAndAssignmentDate(tasks).map((task) => [idWithoutComments(task.id), task]),
  );
  const ordered: WorkMap.Item[] = [];

  for (const id of ordering) {
    const key = idWithoutComments(id);
    const task = remaining.get(key);
    if (task) {
      ordered.push(task);
      remaining.delete(key);
    }
  }

  return [...ordered, ...remaining.values()];
}
