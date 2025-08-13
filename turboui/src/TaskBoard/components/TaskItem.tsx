import { IconFileText, IconMessageCircle } from "../../icons";
import React, { useCallback, useState } from "react";
import { DateField } from "../../DateField";
import { BlackLink } from "../../Link";
import { PersonField } from "../../PersonField";
import { useDraggable } from "../../utils/DragAndDrop";
import classNames from "../../utils/classnames";
import { StatusSelector } from "./StatusSelector";

// Using shared types
import { Person, TaskWithIndex } from "../types";

interface TaskItemProps {
  task: TaskWithIndex;
  milestoneId: string;
  itemStyle: (id: string) => React.CSSProperties;
  onTaskDueDateChange?: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
  onTaskAssigneeChange?: (taskId: string, assignee: Person | null) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<TaskWithIndex>) => void;
  searchPeople?: (params: { query: string }) => Promise<Person[]>;
}

export function TaskItem({ task, milestoneId, itemStyle, onTaskDueDateChange, onTaskAssigneeChange, onTaskUpdate, searchPeople }: TaskItemProps) {
  const [currentAssignee, setCurrentAssignee] = useState<Person | null>(task.assignees?.[0] || null);
  const [currentDueDate, setCurrentDueDate] = useState<DateField.ContextualDate | null>(task.dueDate || null);

  // Set up draggable behavior
  const { ref, isDragging } = useDraggable({ id: task.id, zoneId: `milestone-${milestoneId}` });

  const itemClasses = classNames(isDragging ? "opacity-50 bg-surface-accent" : "");

  const handleAssigneeChange = useCallback((newAssignee: Person | null) => {
    setCurrentAssignee(newAssignee);

    if (onTaskAssigneeChange && task.id) {
      onTaskAssigneeChange(task.id, newAssignee);
    }
  }, [task.id, onTaskAssigneeChange]);

  const handleDueDateChange = useCallback((newDueDate: DateField.ContextualDate | null) => {
    setCurrentDueDate(newDueDate);

    if (onTaskDueDateChange && task.id) {
      onTaskDueDateChange(task.id, newDueDate);
    }
  }, [task.id, onTaskDueDateChange]);

  // Handle status change
  const handleStatusChange = useCallback(
    (newStatus: string) => {
      // Notify parent component if callback is provided
      if (onTaskUpdate && task.id) {
        onTaskUpdate(task.id, { status: newStatus as any });
      }

      // Also dispatch event for backward compatibility
      const changeEvent = new CustomEvent("statusChange", {
        detail: { taskId: task.id, newStatus },
      });
      document.dispatchEvent(changeEvent);
    },
    [task.id, onTaskUpdate],
  );

  return (
    <li ref={ref as React.RefObject<HTMLLIElement>} style={itemStyle(task.id)} className={itemClasses}>
      <div className="flex items-center px-4 py-2.5 group bg-surface-base hover:bg-surface-highlight">
        {/* Left side: Status and task info */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {/* Status icon and title wrapper for alignment */}
          <div className="flex items-center gap-2 h-6">
            {/* Status icon */}
            <div className="flex-shrink-0 flex items-center h-6">
              <StatusSelector status={task.status} onChange={handleStatusChange} size="md" readonly={!onTaskUpdate} />
            </div>
            {/* Task title with inline meta indicators */}
            <BlackLink
              to={`/tasks/${task.id}`}
              className="text-sm hover:text-link-hover transition-colors truncate h-6 flex items-center relative top-[-1px]"
              underline="hover"
            >
              {task.title}
            </BlackLink>
          </div>

          {/* Description indicator */}
          {task.hasDescription && (
            <span className="text-content-subtle flex-shrink-0">
              <IconFileText size={14} />
            </span>
          )}

          {/* Comments indicator */}
          {task.hasComments && (
            <span className="text-content-subtle flex items-center flex-shrink-0">
              <IconMessageCircle size={14} />
              {task.commentCount && <span className="ml-0.5 text-xs text-content-subtle">{task.commentCount}</span>}
            </span>
          )}
        </div>

        {/* Right side: Due date and assignee */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {/* Due date */}
          <div className="flex items-center group/due-date">
            {/* Show DateField when there's a date OR on hover when no date */}
            {currentDueDate || !onTaskDueDateChange ? (
              <DateField
                date={currentDueDate}
                onDateSelect={handleDueDateChange}
                variant="inline"
                hideCalendarIcon={true}
                showOverdueWarning={task.status !== "done" && task.status !== "canceled"}
                placeholder="Set due date"
                readonly={!onTaskDueDateChange}
                size="small"
              />
            ) : (
              /* Empty state that appears on hover */
              <div className="opacity-0 group-hover/due-date:opacity-100 transition-opacity">
                <DateField
                  date={null}
                  onDateSelect={handleDueDateChange}
                  variant="inline"
                  hideCalendarIcon={true}
                  showOverdueWarning={task.status !== "done" && task.status !== "canceled"}
                  placeholder="Set due date"
                  readonly={false}
                  size="small"
                />
              </div>
            )}
          </div>

          {/* Assignee */}
          <div className="flex items-center flex-shrink-0 w-6 h-6">
            <PersonField
              person={currentAssignee}
              setPerson={handleAssigneeChange}
              avatarSize={24}
              avatarOnly={true}
              searchPeople={searchPeople || (async () => [])}
              readonly={!searchPeople}
            />
          </div>
        </div>
      </div>
    </li>
  );
}
