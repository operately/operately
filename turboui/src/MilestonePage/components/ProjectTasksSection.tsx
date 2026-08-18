import React from "react";

import { SecondaryButton } from "../../Button";
import { BlackLink } from "../../Link";
import { IconLayoutKanban, IconPlus } from "../../icons";
import { TaskFilter } from "../../TaskBoard";
import { FilterBadges } from "../../TaskBoard/components/TaskFilter";
import { calculateMilestoneStats } from "../../TaskBoard/components/MilestoneCard";
import TaskList from "../../TaskBoard/components/TaskList";
import { InlineTaskCreator } from "../../TaskBoard/components/InlineTaskCreator";
import { useInlineTaskCreator } from "../../TaskBoard/hooks/useInlineTaskCreator";
import { useTaskKeyboardNavigation } from "../../TaskBoard/hooks/useTaskKeyboardNavigation";
import * as Types from "../../TaskBoard/types";
import { sortTasks } from "../../TaskBoard/utils/sortTasks";
import { Tooltip } from "../../Tooltip";
import { useBoardDnD } from "../../utils/PragmaticDragAndDrop";
import type { BoardMove } from "../../utils/PragmaticDragAndDrop";
import type { MilestonePage } from "../types";
import { variantFeatures } from "../variantFeatures";
import { TaskSectionEmptyState } from "./TaskSectionEmptyState";
import { TaskSectionLayout } from "./TaskSectionLayout";

export function ProjectTasksSection({
  variant,
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
  statusOptions,
  getTaskPageProps,
  taskSlideIn,
  selectedTaskId,
  onTaskOpen,
}: MilestonePage.ProjectState & Props) {
  const {
    containerRef: keyboardNavigationRef,
    selectedTaskId: keyboardSelectedTaskId,
    clearSelection: clearTaskSelection,
    scopeBind: keyboardNavigationScopeBind,
  } = useTaskKeyboardNavigation<HTMLDivElement>({
    clearSelectionWithEscape: !selectedTaskId,
  });
  const {
    open: creatorOpen,
    openCreator,
    closeCreator,
    creatorRef,
    hoverBind,
  } = useInlineTaskCreator({
    requireHover: false,
    onOpen: clearTaskSelection,
  });
  const stats = calculateMilestoneStats(tasks);
  const completionPercentage = calculateCompletionPercentage(stats);
  const filteredTasks = applyFilters(tasks, filters ?? []);
  const orderedTasks = React.useMemo(() => sortTasks(filteredTasks, milestone), [filteredTasks, milestone]);
  const hasHiddenTasks = filteredTasks.some((task) => task.status?.closed === true);
  const handleTaskMove = React.useCallback(
    (move: BoardMove) => {
      onTaskReorder?.(move.itemId, move.destination.containerId, move.destination.index);
    },
    [onTaskReorder],
  );
  const { draggedItemId, destination, draggedItemDimensions } = useBoardDnD(handleTaskMove);
  const renderInlineCreator = (testId: string) =>
    creatorOpen ? (
      <InlineTaskCreator
        ref={creatorRef}
        onCreate={(title) => onTaskCreate?.({ title, milestone, dueDate: null, assignees: [] })}
        onRequestAdvanced={() => setIsTaskModalOpen(true)}
        onCancel={closeCreator}
        autoFocus
        testId={testId}
      />
    ) : null;
  const inlineCreator = renderInlineCreator("inline-task-creator-milestonepage");

  return (
    <TaskSectionLayout
      sectionTestId="tasks-section"
      hoverBind={hoverBind}
      taskSlideIn={taskSlideIn}
      completionPercentage={completionPercentage}
      headerActions={
        <>
          {variantFeatures(variant).showKanbanLink && milestone.kanbanLink && (
            <Tooltip content="View on board" size="sm">
              <BlackLink
                to={milestone.kanbanLink}
                className="flex items-center text-content-dimmed transition-colors md:hover:text-content-base"
                underline="hover"
              >
                <IconLayoutKanban size={18} className="text-content-dimmed" />
                <span className="sr-only">View on board</span>
              </BlackLink>
            </Tooltip>
          )}
          <SecondaryButton size="xs" icon={IconPlus} onClick={openCreator} testId="tasks-section-add-task">
            <span className="sr-only">Add task</span>
          </SecondaryButton>
        </>
      }
      filterControls={
        onFiltersChange && filters ? (
          <div className="flex items-center gap-3 border-b border-surface-outline px-4 py-2">
            <TaskFilter filters={filters} onFiltersChange={onFiltersChange} tasks={tasks} />
            {filters.length > 0 && <FilterBadges filters={filters} onFiltersChange={onFiltersChange} />}
          </div>
        ) : null
      }
    >
      <div
        ref={keyboardNavigationRef}
        {...keyboardNavigationScopeBind}
        className="overflow-hidden rounded-b-lg bg-surface-base"
      >
        {filteredTasks.length === 0 ? (
          <TaskSectionEmptyState
            inlineCreator={renderInlineCreator("inline-task-creator-milestonepage-empty")}
            showCreationPrompt
          />
        ) : (
          <TaskList
            tasks={orderedTasks}
            showHiddenTasksToggle={hasHiddenTasks}
            milestoneId={milestone.id}
            onTaskAssigneeChange={onTaskAssigneeChange}
            onTaskDueDateChange={onTaskDueDateChange}
            onTaskStatusChange={onTaskStatusChange}
            assigneePersonSearch={assigneePersonSearch}
            statusOptions={statusOptions}
            draggedItemId={draggedItemId}
            targetLocation={destination}
            placeholderHeight={draggedItemDimensions?.height ?? null}
            selectedTaskId={keyboardSelectedTaskId}
            onTaskClick={getTaskPageProps ? onTaskOpen : undefined}
            onTaskOpen={getTaskPageProps ? onTaskOpen : undefined}
            inlineCreateRow={inlineCreator}
          />
        )}
      </div>
    </TaskSectionLayout>
  );
}

function applyFilters(tasks: Types.Task[], filters: Types.FilterCondition[]) {
  return tasks.filter((task) => {
    return filters.every((filter) => {
      switch (filter.type) {
        case "status":
          if (filter.operator === "is") {
            if (!task.status || !filter.value) return false;
            return task.status.value === (filter.value as Types.Status).value;
          }

          if (!task.status || !filter.value) return true;
          return task.status.value !== (filter.value as Types.Status).value;
        case "assignee": {
          const hasAssignee = task.assignees?.some((assignee) => assignee.id === filter.value?.id);
          return filter.operator === "is" ? hasAssignee : !hasAssignee;
        }
        case "content": {
          const searchTerm = filter.value?.toLowerCase() || "";
          const taskContent = `${task.title} ${task.description || ""}`.toLowerCase();
          return filter.operator === "contains" ? taskContent.includes(searchTerm) : !taskContent.includes(searchTerm);
        }
        default:
          return true;
      }
    });
  });
}

function calculateCompletionPercentage(stats: Types.MilestoneStats) {
  const activeTasks = stats.total - stats.canceled;
  if (activeTasks === 0) return 0;
  return (stats.done / activeTasks) * 100;
}

type Props = {
  taskSlideIn: React.ReactNode;
  selectedTaskId: string | null;
  onTaskOpen: (taskId: string | null) => void;
};
