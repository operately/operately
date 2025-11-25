import React, { useMemo, useState } from "react";
import { useDraggingAnimation, useDropZone } from "../../utils/DragAndDrop";
import { TaskItem } from "./TaskItem";
import { IconChevronDown, IconChevronRight } from "../../icons";
import { PersonField } from "../../PersonField";
import * as Types from "../types";
import { DateField } from "../../DateField";
import { StatusSelectorV2 } from "../../StatusSelectorV2";

// Using TaskWithIndex from our shared types
import { TaskWithIndex } from "../types";

export interface TaskListProps {
  tasks: Types.Task[];
  milestoneId: string;
  onTaskAssigneeChange: (taskId: string, assignee: Types.Person | null) => void;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
  onTaskStatusChange: (taskId: string, status: string) => void;
  assigneePersonSearch?: PersonField.SearchData;
  statusOptions: StatusSelectorV2.StatusOption[];
  /** Whether to show the hidden tasks toggle (ghost row) */
  showHiddenTasksToggle?: boolean;
  /** Optional inline row to render below active tasks (e.g., inline creator) */
  inlineCreateRow?: React.ReactNode;
}

/**
 * TaskList component with drag and drop functionality
 * Displays a list of tasks for a specific milestone
 * Drag and drop is handled by the DragAndDropProvider in the parent component
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
}: TaskListProps) {
  const [hiddenTasksExpanded, setHiddenTasksExpanded] = useState(false);

  // Separate tasks into visible and hidden based on status.hidden property
  const { visibleTasks, hiddenTasks } = useMemo(() => {
    const visible: Types.Task[] = [];
    const hidden: Types.Task[] = [];

    tasks.forEach((task) => {
      const statusOption = statusOptions.find((opt) => opt.value === task.status);
      const isHidden = statusOption?.hidden === true;

      if (isHidden) {
        hidden.push(task);
      } else {
        visible.push(task);
      }
    });

    return { visibleTasks: visible, hiddenTasks: hidden };
  }, [tasks, statusOptions]);

  // Add drag and drop index to each task (including expanded hidden tasks if needed)
  const allVisibleTasks = useMemo(() => {
    let allTasks = [...visibleTasks];
    if (hiddenTasksExpanded) {
      allTasks = [...visibleTasks, ...hiddenTasks];
    }
    return allTasks;
  }, [visibleTasks, hiddenTasks, hiddenTasksExpanded]);

  const tasksWithIndex = useMemo(() => {
    return allVisibleTasks.map((task, index) => ({ ...task, index }));
  }, [allVisibleTasks]);

  // Set up drop zone for this list of tasks
  const { ref } = useDropZone({
    id: milestoneId,
    dependencies: [tasksWithIndex],
  });

  // Get the animation styles for the container and items
  const { containerStyle, itemStyle } = useDraggingAnimation(milestoneId, tasksWithIndex);

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
      <ul ref={ref as React.RefObject<HTMLUListElement>} style={containerStyle}>
        {/* Regular visible tasks */}
        {tasksWithIndex.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            milestoneId={milestoneId}
            itemStyle={itemStyle}
            onTaskAssigneeChange={onTaskAssigneeChange}
            onTaskDueDateChange={onTaskDueDateChange}
            onTaskStatusChange={onTaskStatusChange}
            assigneePersonSearch={assigneePersonSearch}
            statusOptions={statusOptions}
            draggingDisabled={task.index >= visibleTasks.length}
          />
        ))}
      </ul>

      {/* Inline create row (e.g., add task) */}
      {inlineCreateRow}

      {/* Empty state message when no visible tasks but there are hidden tasks */}
      {visibleTasks.length === 0 && totalHiddenCount > 0 && showHiddenTasksToggle && (
        <div className="py-3 px-4 text-center text-content-subtle text-sm bg-surface-base">
          Click + or press c to add a task, or drag a task here.
        </div>
      )}

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
        hiddenTasks.map((task, index) => (
          <ul
            key={`hidden-${task.id}`}
            className="animate-fadeIn"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <TaskItem
              task={{ ...task, index: visibleTasks.length + index } as TaskWithIndex}
              milestoneId={milestoneId}
              itemStyle={() => ({})}
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
