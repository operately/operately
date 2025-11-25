import React from "react";

import * as Types from "../../TaskBoard/types";
import { SecondaryButton } from "../../Button";
import { PieChart } from "../../PieChart";
import { IconPlus } from "../../icons";
import { DragAndDropProvider } from "../../utils/DragAndDrop";
import { MilestonePage } from "..";
import { calculateMilestoneStats } from "../../TaskBoard/components/MilestoneCard";
import { TaskFilter } from "../../TaskBoard";
import { FilterBadges } from "../../TaskBoard/components/TaskFilter";
import TaskList from "../../TaskBoard/components/TaskList";
import { InlineTaskCreator } from "../../TaskBoard/components/InlineTaskCreator";
import { useInlineTaskCreator } from "../../TaskBoard/hooks/useInlineTaskCreator";

export function TasksSection({
  tasks,
  filters,
  onFiltersChange,
  onTaskReorder,
  milestone,
  onTaskCreate,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onTaskStatusChange,
  assigneePersonSearch,
  setIsTaskModalOpen,
}: MilestonePage.State) {
  const { open: creatorOpen, openCreator, closeCreator, creatorRef, hoverBind } = useInlineTaskCreator({
    requireHover: false,
  });
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

  const handleTaskReorder = React.useCallback(
    (dropZoneId: string, draggedId: string, indexInDropZone: number) => {
      if (onTaskReorder) {
        onTaskReorder(draggedId, dropZoneId, indexInDropZone);
        return true;
      }
      return false;
    },
    [onTaskReorder],
  );

  // Hotkey handled by useInlineTaskCreator

  return (
    <div className="space-y-4 pt-6" data-test-id="tasks-section" {...hoverBind}>
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
          <SecondaryButton
            size="xs"
            icon={IconPlus}
            onClick={openCreator}
            testId="tasks-section-add-task"
          >
            <span className="sr-only">Add task</span>
          </SecondaryButton>
        </div>

        {/* Filter controls */}
        {onFiltersChange && filters && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-surface-outline">
            <TaskFilter filters={filters} onFiltersChange={onFiltersChange} tasks={tasks} />
            {filters?.length > 0 && <FilterBadges filters={filters} onFiltersChange={onFiltersChange} />}
          </div>
        )}

        {/* Task list content */}
        <div className="bg-surface-base rounded-b-lg overflow-hidden">
          {baseFilteredTasks.length === 0 ? (
            /* Empty state with inline creation */
            <div className="px-4 py-6">
              {creatorOpen ? (
                <>
                  <InlineTaskCreator
                    ref={creatorRef}
                    milestone={milestone}
                    onCreate={(t) => {
                      onTaskCreate?.({ ...t, milestone });
                    }}
                    onRequestAdvanced={() => setIsTaskModalOpen(true)}
                    onCancel={closeCreator}
                    autoFocus
                    testId="inline-task-creator-milestonepage-empty"
                  />
                  <div className="px-0 pt-2 text-center text-content-subtle text-xs">
                    Press Enter to add. You can also drag tasks here.
                  </div>
                </>
              ) : (
                <div className="text-center text-content-subtle text-sm">
                  Click + or press c to add a task, or drag a task here.
                </div>
              )}
            </div>
          ) : (
            /* Task list with drag and drop */
            <DragAndDropProvider onDrop={handleTaskReorder}>
              <TaskList
                tasks={baseFilteredTasks}
                showHiddenTasksToggle={baseFilteredTasks.some(
                  (task) => task.status === "done" || task.status === "canceled",
                )}
                milestoneId={milestone.id}
                onTaskAssigneeChange={onTaskAssigneeChange}
                onTaskDueDateChange={onTaskDueDateChange}
                onTaskStatusChange={onTaskStatusChange}
                assigneePersonSearch={assigneePersonSearch}
                statusOptions={DEFAULT_STATUS_OPTIONS}
                inlineCreateRow={
                  creatorOpen ? (
                    <InlineTaskCreator
                      ref={creatorRef}
                      milestone={milestone}
                      onCreate={(t) => onTaskCreate?.({ ...t, milestone })}
                      onRequestAdvanced={() => setIsTaskModalOpen(true)}
                      onCancel={closeCreator}
                      autoFocus
                      testId="inline-task-creator-milestonepage"
                    />
                  ) : undefined
                }
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

// Default status options for milestone tasks. Completed and canceled statuses
// are marked as hidden so they appear in the hidden section of TaskList.
const DEFAULT_STATUS_OPTIONS: Types.StatusOption[] = [
  {
    id: "pending",
    value: "pending",
    label: "Pending",
    icon: "circleDashed",
    color: "dimmed",
    index: 0,
  },
  {
    id: "in_progress",
    value: "in_progress",
    label: "In progress",
    icon: "circleDot",
    color: "brand",
    index: 1,
  },
  {
    id: "done",
    value: "done",
    label: "Done",
    icon: "circleCheck",
    color: "success",
    hidden: true,
    index: 2,
  },
  {
    id: "canceled",
    value: "canceled",
    label: "Canceled",
    icon: "circleX",
    color: "dimmed",
    hidden: true,
    index: 3,
  },
];
