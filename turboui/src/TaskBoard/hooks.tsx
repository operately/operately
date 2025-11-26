import { useMemo } from "react";
import { FilterCondition, Milestone, Task } from "./types";
import { includesId } from "../utils/ids";
import { applyFilters } from "./utils/taskFilterUtils";

/**
 * Hook that filters tasks based on filters and milestone status
 * If no filters are applied, tasks with 'done' or 'canceled' status are hidden by default
 * Also tracks hidden tasks grouped by milestone
 */
export function useFilteredTasks(tasks: Task[], milestones: Milestone[], filters: FilterCondition[]) {
  const hasAnyFilters = useMemo(() => filters.length > 0, [filters]);

  return useMemo(() => {
    const showHiddenTasksToggle = !hasAnyFilters;
    const closedMilestoneIds = milestones.filter((m) => m.status === "done").map((m) => m.id);

    const tasksToFilter = tasks.filter((task) => !includesId(closedMilestoneIds, task.milestone?.id));

    const filtered = applyFilters(tasksToFilter, filters);

    // Group hidden tasks by milestone
    const hiddenByMilestone: Record<string, Task[]> = {
      no_milestone: [],
    };

    return {
      filteredTasks: filtered,
      hiddenTasksByMilestone: hiddenByMilestone,
      showHiddenTasksToggle,
    };
  }, [tasks, milestones, filters, hasAnyFilters]);
}
