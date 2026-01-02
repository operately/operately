import { IconFileText, IconMessageCircle } from "../../icons";
import React, { useCallback, useState } from "react";
import { DateField } from "../../DateField";
import { BlackLink } from "../../Link";
import { PersonField } from "../../PersonField";
import { useSortableItem } from "../../utils/PragmaticDragAndDrop";
import classNames from "../../utils/classnames";
import { StatusSelector } from "../../StatusSelector";
import { createTestId } from "../../TestableElement";

// Using shared types
import { Person, TaskWithIndex, Status } from "../types";

interface TaskItemProps {
  task: TaskWithIndex;
  milestoneId: string;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
  onTaskAssigneeChange: (taskId: string, assignee: Person | null) => void;
  onTaskStatusChange: (taskId: string, status: Status | null) => void;
  assigneePersonSearch?: PersonField.SearchData;
  statusOptions: StatusSelector.StatusOption[];
  draggingDisabled?: boolean;
}

export function TaskItem({
  task,
  milestoneId,
  onTaskDueDateChange,
  onTaskAssigneeChange,
  onTaskStatusChange,
  assigneePersonSearch,
  statusOptions,
  draggingDisabled = false,
}: TaskItemProps) {
  const [currentAssignee, setCurrentAssignee] = useState<Person | null>(task.assignees?.[0] || null);
  const [currentDueDate, setCurrentDueDate] = useState<DateField.ContextualDate | null>(task.dueDate || null);
  const [currentStatus, setCurrentStatus] = useState<StatusSelector.StatusOption | null>(
    task.status ?? statusOptions[0] ?? null,
  );

  // Set up draggable behavior
  const { ref, isDragging } = useSortableItem({
    itemId: task.id,
    index: task.index,
    containerId: milestoneId,
    disabled: draggingDisabled,
  });

  const itemClasses = classNames(isDragging ? "bg-surface-accent" : "");

  const handleAssigneeChange = useCallback(
    (newAssignee: Person | null) => {
      setCurrentAssignee(newAssignee);

      if (onTaskAssigneeChange && task.id) {
        onTaskAssigneeChange(task.id, newAssignee);
      }
    },
    [task.id, onTaskAssigneeChange],
  );

  const handleDueDateChange = useCallback(
    (newDueDate: DateField.ContextualDate | null) => {
      setCurrentDueDate(newDueDate);

      if (onTaskDueDateChange && task.id) {
        onTaskDueDateChange(task.id, newDueDate);
      }
    },
    [task.id, onTaskDueDateChange],
  );

  const handleStatusChange = useCallback(
    (newStatus: StatusSelector.StatusOption) => {
      setCurrentStatus(newStatus);

      if (onTaskStatusChange && task.id) {
        onTaskStatusChange(task.id, newStatus);
      }
    },
    [task.id, onTaskStatusChange],
  );

  const stopDragFromInteractive = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <li ref={ref as React.RefObject<HTMLLIElement>} className={classNames("group/task-row", itemClasses)}>
      <div
        className="flex items-center px-4 py-2.5 bg-surface-base hover:bg-surface-highlight"
        data-test-id={createTestId("task", task.id)}
      >
        {/* Left side: Status and task info */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Status icon */}
            <div className="flex-shrink-0 flex items-center h-6" onMouseDown={stopDragFromInteractive}>
              {currentStatus && (
                <StatusSelector
                  statusOptions={statusOptions}
                  status={currentStatus}
                  onChange={handleStatusChange}
                  size="md"
                  readonly={!onTaskStatusChange}
                />
              )}
            </div>

            {/* Task title with inline meta indicators */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="flex-1 min-w-0" onMouseDown={stopDragFromInteractive}>
                <BlackLink
                  to={task.link}
                  className="flex-1 min-w-0 max-w-full text-sm font-medium hover:text-link-hover transition-colors"
                  underline="hover"
                  title={task.title}
                >
                  <span className="inline-flex items-center gap-1.5 truncate max-w-full h-6 relative top-[-1px]">
                    <span className="truncate">{task.title}</span>

                    {task.hasDescription && (
                      <span
                        className="text-content-dimmed flex-shrink-0"
                        title="Has description"
                        data-test-id="description-indicator"
                      >
                        <IconFileText size={14} />
                      </span>
                    )}

                    {task.hasComments && (
                      <span
                        className="text-content-dimmed flex items-center flex-shrink-0"
                        title={`${task.commentCount} comment${task.commentCount === 1 ? "" : "s"}`}
                        data-test-id="comments-indicator"
                      >
                        <IconMessageCircle size={14} />
                        <span className="ml-0.5 text-xs text-content-dimmed">{task.commentCount}</span>
                      </span>
                    )}
                  </span>
                </BlackLink>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-3 sm:ml-4">
          <div className="sm:hidden flex items-center" onMouseDown={stopDragFromInteractive}>
            <DateField
              date={currentDueDate}
              onDateSelect={handleDueDateChange}
              variant="inline"
              hideCalendarIcon={!!currentDueDate}
              showOverdueWarning={!task.status?.closed}
              placeholder={currentDueDate ? "Set due date" : ""}
              readonly={!onTaskDueDateChange}
              size={currentDueDate ? "small" : "lg"}
              calendarOnly
              testId="task-due-date-mobile"
              ariaLabel="Set due date"
              className={
                currentDueDate
                  ? ""
                  : "text-content-subtle [&>span]:text-content-subtle [&>span_svg]:text-content-subtle"
              }
            />
          </div>

          <div className="hidden sm:flex" onMouseDown={stopDragFromInteractive}>
            <DateField
              date={currentDueDate}
              onDateSelect={handleDueDateChange}
              variant="inline"
              hideCalendarIcon={true}
              showOverdueWarning={!task.status?.closed}
              placeholder={currentDueDate ? "" : "Set due date"}
              readonly={!onTaskDueDateChange}
              size="small"
              calendarOnly
              testId="task-due-date"
              ariaLabel="Set due date"
              className={
                currentDueDate
                  ? ""
                  : "[&>span]:text-transparent group-hover/task-row:[&>span]:text-content-dimmed group-focus-within/task-row:[&>span]:text-content-dimmed"
              }
            />
          </div>

          <div className="flex items-center flex-shrink-0 w-6 h-6" onMouseDown={stopDragFromInteractive}>
            {assigneePersonSearch ? (
              <PersonField
                person={currentAssignee}
                setPerson={handleAssigneeChange}
                avatarSize={24}
                avatarOnly={true}
                searchData={assigneePersonSearch}
              />
            ) : (
              <PersonField
                person={currentAssignee}
                setPerson={handleAssigneeChange}
                avatarSize={24}
                avatarOnly={true}
                readonly={true}
              />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
