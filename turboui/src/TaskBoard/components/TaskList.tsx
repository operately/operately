import React, { useMemo, useState, useEffect, useRef } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { projectItemsWithPlaceholder, SubtleDropPlaceholder } from "../../utils/PragmaticDragAndDrop";
import type { BoardLocation } from "../../utils/PragmaticDragAndDrop";
import { TaskItem } from "./TaskItem";
import { IconChevronDown, IconChevronRight } from "../../icons";
import { PersonField } from "../../PersonField";
import * as Types from "../types";
import { DateField } from "../../DateField";
import { StatusSelector } from "../../StatusSelector";

// Using TaskWithIndex from our shared types
import { TaskWithIndex } from "../types";

export interface TaskListProps {
  tasks: Types.Task[];
  milestoneId: string;
  onTaskAssigneeChange: (taskId: string, assignees: Types.Person[]) => void;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
  onTaskStatusChange: (taskId: string, status: Types.Status | null) => void;
  assigneePersonSearch?: PersonField.SearchData;
  statusOptions: StatusSelector.StatusOption[];
  /** Whether to show the hidden tasks toggle (ghost row) */
  showHiddenTasksToggle?: boolean;
  /** Optional inline row to render below active tasks (e.g., inline creator) */
  inlineCreateRow?: React.ReactNode;
  /** Hide the generic empty-task prompt when only completed tasks are present */
  suppressEmptyStateWhenOnlyHiddenTasks?: boolean;
  draggedItemId?: string | null;
  targetLocation?: BoardLocation | null;
  placeholderHeight?: number | null;
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string) => void;
}

/**
 * TaskList component with drag and drop functionality
 * Displays a list of tasks for a specific milestone
 * Drag and drop is handled by Pragmatic DnD in the parent component
 */
export function TaskList({
  tasks,
  showHiddenTasksToggle = false,
  milestoneId,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onTaskStatusChange,
  assigneePersonSearch,
  statusOptions,
  inlineCreateRow,
  suppressEmptyStateWhenOnlyHiddenTasks = false,
  draggedItemId = null,
  targetLocation = null,
  placeholderHeight = null,
  selectedTaskId = null,
  onTaskClick,
}: TaskListProps) {
  const [hiddenTasksExpanded, setHiddenTasksExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Separate tasks into visible and hidden based on status.hidden property
  const { visibleTasks, hiddenTasks } = useMemo(() => {
    const visible: Types.Task[] = [];
    const hidden: Types.Task[] = [];

    tasks.forEach((task) => {
      if (task.status?.closed) {
        hidden.push(task);
      } else {
        visible.push(task);
      }
    });

    return { visibleTasks: visible, hiddenTasks: sortCompletedTasks(hidden) };
  }, [tasks]);

  const { items: visibleTasksProjected, placeholderIndex } = useMemo(
    () =>
      projectItemsWithPlaceholder({
        items: visibleTasks,
        getId: (task) => task.id,
        draggedItemId,
        targetLocation,
        containerId: milestoneId,
      }),
    [draggedItemId, milestoneId, targetLocation, visibleTasks],
  );

  // Add drag and drop index to each task.
  // Visible tasks always occupy the first slots; hidden tasks (when expanded) follow after them.
  const visibleTasksWithIndex = useMemo(() => {
    return visibleTasksProjected.map((task, index) => ({ ...task, index }));
  }, [visibleTasksProjected]);

  const hiddenTasksWithIndex = useMemo(() => {
    if (!hiddenTasksExpanded) return [] as TaskWithIndex[];
    return hiddenTasks.map((task, index) => ({ ...task, index: visibleTasks.length + index }));
  }, [hiddenTasksExpanded, hiddenTasks, visibleTasks.length]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({
        containerId: milestoneId,
        index: visibleTasksProjected.length,
      }),
    });
  }, [milestoneId, visibleTasksProjected.length]);

  // Count hidden tasks for the ghost row
  const totalHiddenCount = hiddenTasks.length;

  // Show ghost row only if enabled and there are hidden tasks
  const showGhostRow = showHiddenTasksToggle && totalHiddenCount > 0;

  // Handle ghost row click
  const handleGhostRowClick = () => {
    setHiddenTasksExpanded(!hiddenTasksExpanded);
  };

  return (
    <>
      <div ref={containerRef}>
        <ul>
          {/* Regular visible tasks */}
          {visibleTasksWithIndex.map((task, index) => (
            <React.Fragment key={task.id}>
              {placeholderIndex === index && (
                <li>
                  <SubtleDropPlaceholder containerId={milestoneId} index={index} height={placeholderHeight} />
                </li>
              )}
              <TaskItem
                task={task}
                milestoneId={milestoneId}
                onTaskAssigneeChange={onTaskAssigneeChange}
                onTaskDueDateChange={onTaskDueDateChange}
                onTaskStatusChange={onTaskStatusChange}
                assigneePersonSearch={assigneePersonSearch}
                statusOptions={statusOptions}
                draggingDisabled={false}
                selected={task.id === selectedTaskId}
                onTaskClick={onTaskClick}
              />
            </React.Fragment>
          ))}
          {placeholderIndex !== null && placeholderIndex === visibleTasksWithIndex.length && (
            <li>
              <SubtleDropPlaceholder
                containerId={milestoneId}
                index={visibleTasksWithIndex.length}
                height={placeholderHeight}
              />
            </li>
          )}
        </ul>

        {/* Inline create row (e.g., add task) */}
        {inlineCreateRow}

        {/* Empty state message when no visible tasks but there are hidden tasks */}
        {visibleTasks.length === 0 &&
          totalHiddenCount > 0 &&
          showHiddenTasksToggle &&
          !suppressEmptyStateWhenOnlyHiddenTasks && (
            <div className="py-3 px-4 text-left text-content-subtle text-sm bg-surface-base sm:text-center">
              <span className="sm:hidden">Tap + to add a task.</span>
              <span className="hidden sm:inline">Click + or press c to add a task, or drag a task here.</span>
            </div>
          )}
      </div>

      {/* Ghost row for hidden tasks */}
      {showGhostRow && (
        <div
          className="px-4 py-2 text-sm text-content-dimmed hover:text-content-base cursor-pointer hover:bg-surface-accent transition-colors bg-surface-base"
          onClick={handleGhostRowClick}
        >
          <div className="flex items-center gap-2">
            <div className="transition-transform duration-200">
              {hiddenTasksExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            </div>
            {hiddenTasksExpanded ? (
              <>
                <span className="sm:hidden">Hide completed</span>
                <span className="hidden sm:inline">
                  {totalHiddenCount} completed task{totalHiddenCount !== 1 ? "s" : ""} (click to collapse)
                </span>
              </>
            ) : (
              <>
                <span className="sm:hidden">
                  {totalHiddenCount} completed task{totalHiddenCount !== 1 ? "s" : ""}
                </span>
                <span className="hidden sm:inline">
                  Show {totalHiddenCount} completed task{totalHiddenCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden tasks that are expanded with animation */}
      {hiddenTasksExpanded &&
        hiddenTasksWithIndex.map((task, index) => (
          <ul
            key={`hidden-${task.id}`}
            className="animate-fadeIn"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <TaskItem
              task={task}
              milestoneId={milestoneId}
              onTaskAssigneeChange={onTaskAssigneeChange}
              onTaskDueDateChange={onTaskDueDateChange}
              onTaskStatusChange={onTaskStatusChange}
              assigneePersonSearch={assigneePersonSearch}
              statusOptions={statusOptions}
              draggingDisabled={true}
              selected={task.id === selectedTaskId}
              onTaskClick={onTaskClick}
            />
          </ul>
        ))}
    </>
  );
}

function sortCompletedTasks(tasks: Types.Task[]): Types.Task[] {
  return [...tasks].sort((a, b) => completionTime(b) - completionTime(a));
}

function completionTime(task: Types.Task): number {
  return task.closedAt?.getTime() ?? 0;
}

export default TaskList;
