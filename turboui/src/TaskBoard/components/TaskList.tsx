import React, { useMemo, useState, useEffect, useRef } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { DropPlaceholder, projectItemsWithPlaceholder } from "../../utils/PragmaticDragAndDrop";
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
  onTaskAssigneeChange: (taskId: string, assignee: Types.Person | null) => void;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
  onTaskStatusChange: (taskId: string, status: Types.Status | null) => void;
  assigneePersonSearch?: PersonField.SearchData;
  statusOptions: StatusSelector.StatusOption[];
  /** Whether to show the hidden tasks toggle (ghost row) */
  showHiddenTasksToggle?: boolean;
  /** Optional inline row to render below active tasks (e.g., inline creator) */
  inlineCreateRow?: React.ReactNode;
  draggedItemId?: string | null;
  targetLocation?: BoardLocation | null;
  placeholderHeight?: number | null;
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
  draggedItemId = null,
  targetLocation = null,
  placeholderHeight = null,
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

    return { visibleTasks: visible, hiddenTasks: hidden };
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
                  <DropPlaceholder containerId={milestoneId} index={index} height={placeholderHeight} />
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
              />
            </React.Fragment>
          ))}
          {placeholderIndex !== null && placeholderIndex === visibleTasksWithIndex.length && (
            <li>
              <DropPlaceholder
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
        {visibleTasks.length === 0 && totalHiddenCount > 0 && showHiddenTasksToggle && (
          <div className="py-3 px-4 text-center text-content-subtle text-sm bg-surface-base">
            Click + or press c to add a task, or drag a task here.
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
            <span>
              {hiddenTasksExpanded
                ? `${totalHiddenCount} completed task${totalHiddenCount !== 1 ? "s" : ""} (click to collapse)`
                : `Show ${totalHiddenCount} completed task${totalHiddenCount !== 1 ? "s" : ""}`}
            </span>
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
            />
          </ul>
        ))}
    </>
  );
}

export default TaskList;
