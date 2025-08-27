import React from "react";

import * as Types from "../../TaskBoard/types";
import { PrimaryButton } from "../../Button";
import { PieChart } from "../../PieChart";
import { IconPlus } from "../../icons";
import { DragAndDropProvider } from "../../utils/DragAndDrop";
import { reorderTasksInList } from "../../TaskBoard/utils/taskReorderingUtils";
import { MilestonePage } from "..";
import { calculateMilestoneStats } from "../../TaskBoard/components/MilestoneCard";
import { TaskFilter } from "../../TaskBoard";
import { FilterBadges } from "../../TaskBoard/components/TaskFilter";
import TaskList from "../../TaskBoard/components/TaskList";

export function TasksSection({
  tasks,
  filters,
  onFiltersChange,
  onTaskReorder,
  milestone,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onTaskStatusChange,
  searchPeople,
  setIsTaskModalOpen,
}: MilestonePage.State) {
  const stats = calculateMilestoneStats(tasks);
  const completionPercentage = calculateCompletionPercentage(stats);

  const applyFilters = (tasks: Types.Task[], filters: Types.FilterCondition[]) => {
    return tasks.filter((task) => {
      return filters.every((filter) => {
        switch (filter.type) {
          case "status":
            return filter.operator === "is" ? task.status === filter.value : task.status !== filter.value;
          case "assignee":
            const hasAssignee = task.assignees?.some((assignee) => assignee.id === filter.value?.id);
            return filter.operator === "is" ? hasAssignee : !hasAssignee;
          case "content":
            const searchTerm = filter.value?.toLowerCase() || "";
            const taskContent = `${task.title} ${task.description || ""}`.toLowerCase();
            return filter.operator === "contains"
              ? taskContent.includes(searchTerm)
              : !taskContent.includes(searchTerm);
          default:
            return true;
        }
      });
    });
  };

  // Filter tasks based on current filters
  const baseFilteredTasks = applyFilters(tasks, filters || []);

  // Separate visible tasks from hidden (completed) tasks
  const visibleTasks = baseFilteredTasks.filter((task) => task.status === "pending" || task.status === "in_progress");
  const hiddenTasks = baseFilteredTasks.filter((task) => task.status === "done" || task.status === "canceled");

  return (
    <div className="space-y-4">
      {/* Task header container - visually groups all task-related controls */}
      <div className="bg-surface-dimmed rounded-lg border border-surface-outline">
        {/* Header bar with title, pie chart, and primary action */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-outline">
          <div className="flex items-center gap-3">
            <div className="h-4 w-6 flex items-center justify-center">
              <PieChart
                size={24}
                slices={[
                  {
                    percentage: completionPercentage,
                    color: "var(--color-callout-success-content)",
                  },
                ]}
              />
            </div>
            <h2 className="font-bold">Tasks</h2>
          </div>
          <PrimaryButton size="xs" icon={IconPlus} onClick={() => setIsTaskModalOpen(true)}>
            Add Task
          </PrimaryButton>
        </div>

        {/* Filter controls */}
        {onFiltersChange && filters && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-surface-outline">
            <TaskFilter filters={filters} onFiltersChange={onFiltersChange} tasks={tasks} />
            {filters?.length > 0 && <FilterBadges filters={filters} onFiltersChange={onFiltersChange} />}
          </div>
        )}

        {/* Task list content */}
        <div className="bg-surface-base">
          {visibleTasks.length === 0 && hiddenTasks.length === 0 ? (
            /* Empty state */
            <div className="px-4 py-8 text-center text-content-subtle">
              <p className="text-sm">No tasks yet. Click "Add Task" to get started.</p>
            </div>
          ) : (
            /* Task list with drag and drop */
            <DragAndDropProvider
              onDrop={(_, draggedId, index) => {
                if (onTaskReorder) {
                  // Reorder only the visible tasks
                  const reorderedVisibleTasks = reorderTasksInList(visibleTasks, draggedId, index);
                  // Merge reordered visible tasks with hidden tasks to maintain complete list
                  const completeReorderedTasks = [...reorderedVisibleTasks, ...hiddenTasks];
                  onTaskReorder(completeReorderedTasks);
                  return true;
                }
                return false;
              }}
            >
              <TaskList
                tasks={visibleTasks}
                hiddenTasks={hiddenTasks}
                showHiddenTasksToggle={hiddenTasks.length > 0}
                milestoneId={milestone.id}
                onTaskAssigneeChange={onTaskAssigneeChange || (() => {})}
                onTaskDueDateChange={onTaskDueDateChange || (() => {})}
                onTaskStatusChange={onTaskStatusChange || (() => {})}
                searchPeople={searchPeople}
              />
            </DragAndDropProvider>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateCompletionPercentage(stats: {
  pending: number;
  inProgress: number;
  done: number;
  canceled: number;
  total: number;
}) {
  // Active tasks are those that aren't canceled
  const activeTasks = stats.total - stats.canceled;

  // If there are no active tasks, show as 0% complete
  if (activeTasks === 0) return 0;

  // Calculate percentage based only on active tasks
  return (stats.done / activeTasks) * 100;
}
