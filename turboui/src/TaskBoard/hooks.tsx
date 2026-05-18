import { useMemo } from "react";
import { FilterCondition, Task } from "./types";
import { applyFilters } from "./utils/taskFilterUtils";

/**
 * Hook that filters tasks based on filters
 * If no filters are applied, tasks with 'done' or 'canceled' status are hidden by default
 */
export function useFilteredTasks(tasks: Task[], filters: FilterCondition[]) {
  const hasAnyFilters = useMemo(() => filters.length > 0, [filters]);

  return useMemo(() => {
    const showHiddenTasksToggle = !hasAnyFilters;
    const filtered = applyFilters(tasks, filters);

    return {
      filteredTasks: filtered,
      showHiddenTasksToggle,
    };
  }, [tasks, filters, hasAnyFilters]);
}
