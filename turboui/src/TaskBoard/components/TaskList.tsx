import React, { useMemo, useState } from "react";
import { useDraggingAnimation, useDropZone } from "../../utils/DragAndDrop";
import { TaskItem } from "./TaskItem";
import { IconChevronDown, IconChevronRight } from "../../icons";
import * as Types from "../types";
import { DateField } from "../../DateField";

// Using TaskWithIndex from our shared types
import { TaskWithIndex } from "../types";

export interface TaskListProps {
  tasks: Types.Task[];
  hiddenTasks?: Types.Task[];
  milestoneId: string;
  onTaskAssigneeChange: (taskId: string, assignee: Types.Person | null) => void;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
  onTaskStatusChange: (taskId: string, status: string) => void;
  searchPeople?: (params: { query: string }) => Promise<Types.Person[]>;
  /** Whether to show the hidden tasks toggle (ghost row) */
  showHiddenTasksToggle?: boolean;
}

/**
 * TaskList component with drag and drop functionality
 * Displays a list of tasks for a specific milestone
 * Drag and drop is handled by the DragAndDropProvider in the parent component
 */
export function TaskList({
  tasks,
  hiddenTasks = [],
  showHiddenTasksToggle = false,
  milestoneId,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onTaskStatusChange,
  searchPeople,
}: TaskListProps) {
  const [hiddenTasksExpanded, setHiddenTasksExpanded] = useState(false);

  // Add drag and drop index to each task (including expanded hidden tasks if needed)
  const allVisibleTasks = useMemo(() => {
    let allTasks = [...tasks];
    if (hiddenTasksExpanded) {
      allTasks = [...tasks, ...hiddenTasks];
    }
    return allTasks;
  }, [tasks, hiddenTasks, hiddenTasksExpanded]);

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
    <ul ref={ref as React.RefObject<HTMLUListElement>} style={containerStyle}>
      {/* Regular visible tasks */}
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={{ ...task, index } as TaskWithIndex}
          milestoneId={milestoneId}
          itemStyle={itemStyle}
          onTaskAssigneeChange={onTaskAssigneeChange}
          onTaskDueDateChange={onTaskDueDateChange}
          onTaskStatusChange={onTaskStatusChange}
          searchPeople={searchPeople}
        />
      ))}

      {/* Empty state message when no visible tasks but there are hidden tasks */}
      {tasks.length === 0 && totalHiddenCount > 0 && showHiddenTasksToggle && (
        <li className="py-3 px-4 text-center text-content-subtle text-sm bg-surface-base">
          Click + to add a task or drag a task here.
        </li>
      )}

      {/* Ghost row for hidden tasks */}
      {showGhostRow && (
        <li
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
        </li>
      )}

      {/* Hidden tasks that are expanded with animation */}
      {hiddenTasksExpanded &&
        hiddenTasks.map((task, index) => (
          <div
            key={`hidden-${task.id}`}
            className="animate-fadeIn"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <TaskItem
              task={{ ...task, index: tasks.length + index } as TaskWithIndex}
              milestoneId={milestoneId}
              itemStyle={itemStyle}
              onTaskAssigneeChange={onTaskAssigneeChange}
              onTaskDueDateChange={onTaskDueDateChange}
              onTaskStatusChange={onTaskStatusChange}
              searchPeople={searchPeople}
              draggingDisabled
            />
          </div>
        ))}
    </ul>
  );
}

export default TaskList;
