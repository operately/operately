import { IconFileText, IconMessageCircle } from "../../icons";
import React, { useCallback, useState } from "react";
import { DateField } from "../../DateField";
import { BlackLink } from "../../Link";
import { AssigneesField } from "../../AssigneesField";
import { PersonField } from "../../PersonField";
import { useSortableItem } from "../../utils/PragmaticDragAndDrop";
import classNames from "../../utils/classnames";
import { StatusSelector } from "../../StatusSelector";
import { createTestId } from "../../TestableElement";
import {
  OPEN_TASK_ASSIGNEE_EVENT,
  OPEN_TASK_DUE_DATE_EVENT,
  OPEN_TASK_EVENT,
  OPEN_TASK_STATUS_EVENT,
} from "../hooks/useTaskKeyboardNavigation";
import { useShortcutFieldFocusRestore } from "../hooks/useShortcutFieldFocusRestore";

// Using shared types
import { Person, TaskWithIndex, Status } from "../types";

type DueDateFieldTarget = "mobile" | "desktop" | null;

interface TaskItemProps {
  task: TaskWithIndex;
  milestoneId: string;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
  onTaskAssigneeChange: (taskId: string, assignees: Person[]) => void;
  onTaskStatusChange: (taskId: string, status: Status | null) => void;
  assigneePersonSearch?: PersonField.SearchData;
  statusOptions: StatusSelector.StatusOption[];
  draggingDisabled?: boolean;
  selected?: boolean;
  onTaskClick?: (taskId: string) => void;
  onTaskOpen?: (taskId: string) => void;
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
  selected = false,
  onTaskClick,
  onTaskOpen,
}: TaskItemProps) {
  const [currentAssignees, setCurrentAssignees] = useState<Person[]>(task.assignees || []);
  const [currentDueDate, setCurrentDueDate] = useState<DateField.ContextualDate | null>(task.dueDate || null);
  const [currentStatus, setCurrentStatus] = useState<StatusSelector.StatusOption | null>(
    task.status ?? statusOptions[0] ?? null,
  );
  const [assigneeFieldOpen, setAssigneeFieldOpen] = useState(false);
  const [statusFieldOpen, setStatusFieldOpen] = useState(false);
  const [dueDateFieldTarget, setDueDateFieldTarget] = useState<DueDateFieldTarget>(null);

  // Set up draggable behavior
  const { ref, isDragging } = useSortableItem({
    itemId: task.id,
    index: task.index,
    containerId: milestoneId,
    disabled: draggingDisabled,
  });

  const { prepareFocusRestore, restoreFocusAfterOpenChange, restoreFocusOnCloseAutoFocus } =
    useShortcutFieldFocusRestore(ref);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const openAssigneeField = () => {
      if (!assigneePersonSearch) return;

      prepareFocusRestore();
      setAssigneeFieldOpen(true);
    };

    const openStatusField = () => {
      if (!onTaskStatusChange) return;

      prepareFocusRestore();
      setStatusFieldOpen(true);
    };

    const openDueDateField = () => {
      if (!onTaskDueDateChange) return;

      prepareFocusRestore();
      setDueDateFieldTarget(isMobileViewport() ? "mobile" : "desktop");
    };

    const openTask = () => {
      (onTaskOpen ?? onTaskClick)?.(task.id);
    };

    element.addEventListener(OPEN_TASK_ASSIGNEE_EVENT, openAssigneeField);
    element.addEventListener(OPEN_TASK_STATUS_EVENT, openStatusField);
    element.addEventListener(OPEN_TASK_DUE_DATE_EVENT, openDueDateField);
    element.addEventListener(OPEN_TASK_EVENT, openTask);
    return () => {
      element.removeEventListener(OPEN_TASK_ASSIGNEE_EVENT, openAssigneeField);
      element.removeEventListener(OPEN_TASK_STATUS_EVENT, openStatusField);
      element.removeEventListener(OPEN_TASK_DUE_DATE_EVENT, openDueDateField);
      element.removeEventListener(OPEN_TASK_EVENT, openTask);
    };
  }, [
    assigneePersonSearch,
    onTaskClick,
    onTaskDueDateChange,
    onTaskOpen,
    onTaskStatusChange,
    prepareFocusRestore,
    ref,
    task.id,
  ]);

  React.useEffect(() => {
    setCurrentAssignees(task.assignees || []);
    setCurrentDueDate(task.dueDate || null);
    setCurrentStatus(task.status ?? statusOptions[0] ?? null);
  }, [task.assignees, task.dueDate, task.id, task.status, statusOptions]);

  const itemClasses = classNames(isDragging ? "bg-surface-accent" : "", {
    "cursor-grab": !draggingDisabled && !isDragging,
    "cursor-grabbing": !draggingDisabled && isDragging,
    "cursor-default": draggingDisabled,
  });

  const handleAssigneesChange = useCallback(
    (newAssignees: Person[]) => {
      setCurrentAssignees(newAssignees);

      if (onTaskAssigneeChange && task.id) {
        onTaskAssigneeChange(task.id, newAssignees);
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

  const handleAssigneeFieldOpenChange = useCallback(
    (isOpen: boolean) => {
      setAssigneeFieldOpen(isOpen);
      restoreFocusAfterOpenChange(isOpen);
    },
    [restoreFocusAfterOpenChange],
  );

  const handleStatusFieldOpenChange = useCallback(
    (isOpen: boolean) => {
      setStatusFieldOpen(isOpen);
      restoreFocusAfterOpenChange(isOpen);
    },
    [restoreFocusAfterOpenChange],
  );

  const handleDueDateFieldOpenChange = useCallback(
    (target: Exclude<DueDateFieldTarget, null>, isOpen: boolean) => {
      setDueDateFieldTarget(isOpen ? target : null);
      restoreFocusAfterOpenChange(isOpen);
    },
    [restoreFocusAfterOpenChange],
  );

  return (
    <li
      ref={ref as React.RefObject<HTMLLIElement>}
      className={classNames("group/task-row focus-visible:outline-none", itemClasses)}
      data-task-row-id={task.id}
      data-selected={selected ? "true" : "false"}
      tabIndex={-1}
      aria-selected={selected}
    >
      <div
        className={classNames(
          "flex items-center px-4 py-2.5 transition-colors",
          selected
            ? "bg-[rgba(224,242,254,0.75)] shadow-[inset_0_0_0_2px_var(--color-brand-1)] dark:bg-[rgba(37,99,235,0.20)]"
            : "bg-surface-base hover:bg-surface-highlight group-focus-visible/task-row:bg-[rgba(224,242,254,0.75)] group-focus-visible/task-row:shadow-[inset_0_0_0_2px_var(--color-brand-1)] dark:group-focus-visible/task-row:bg-[rgba(37,99,235,0.20)]",
        )}
        data-test-id={createTestId("task", task.id)}
      >
        {/* Left side: Status and task info */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Status icon */}
            <div className="flex-shrink-0 flex items-center h-6 cursor-pointer" onMouseDown={stopDragFromInteractive}>
              {currentStatus && (
                <StatusSelector
                  statusOptions={statusOptions}
                  status={currentStatus}
                  onChange={handleStatusChange}
                  size="md"
                  readonly={!onTaskStatusChange}
                  isOpen={statusFieldOpen}
                  onOpenChange={handleStatusFieldOpenChange}
                  onCloseAutoFocus={restoreFocusOnCloseAutoFocus}
                />
              )}
            </div>

            {/* Task title with inline meta indicators */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="flex-1 min-w-0 cursor-pointer" onMouseDown={stopDragFromInteractive}>
                {onTaskClick ? (
                  <button
                    type="button"
                    className="flex-1 min-w-0 max-w-full text-sm font-medium text-content-base hover:text-link-hover hover:underline underline-offset-2 transition-colors text-left"
                    title={task.title}
                    onClick={() => onTaskClick(task.id)}
                    data-test-id={createTestId("task-title", task.id)}
                  >
                    <TaskTitleContent task={task} />
                  </button>
                ) : (
                  <BlackLink
                    to={task.link}
                    className="flex-1 min-w-0 max-w-full text-sm font-medium hover:text-link-hover transition-colors"
                    underline="hover"
                    title={task.title}
                  >
                    <TaskTitleContent task={task} />
                  </BlackLink>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-3 sm:ml-4">
          <div className="sm:hidden flex items-center cursor-pointer" onMouseDown={stopDragFromInteractive}>
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
              isOpen={dueDateFieldTarget === "mobile"}
              onOpenChange={(isOpen) => handleDueDateFieldOpenChange("mobile", isOpen)}
              onCloseAutoFocus={restoreFocusOnCloseAutoFocus}
            />
          </div>

          <div className="hidden sm:flex cursor-pointer" onMouseDown={stopDragFromInteractive}>
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
              isOpen={dueDateFieldTarget === "desktop"}
              onOpenChange={(isOpen) => handleDueDateFieldOpenChange("desktop", isOpen)}
              onCloseAutoFocus={restoreFocusOnCloseAutoFocus}
            />
          </div>

          <div
            className="flex items-center justify-end flex-shrink-0 min-w-6 max-w-[7rem] h-6 cursor-pointer"
            onMouseDown={stopDragFromInteractive}
          >
            {assigneePersonSearch ? (
              <AssigneesField
                people={currentAssignees}
                setPeople={handleAssigneesChange}
                avatarSize={24}
                avatarOnly={true}
                maxAvatars={4}
                searchData={assigneePersonSearch}
                isOpen={assigneeFieldOpen}
                onOpenChange={handleAssigneeFieldOpenChange}
                onCloseAutoFocus={restoreFocusOnCloseAutoFocus}
              />
            ) : (
              <AssigneesField
                people={currentAssignees}
                setPeople={handleAssigneesChange}
                avatarSize={24}
                avatarOnly={true}
                maxAvatars={4}
                readonly={true}
              />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function TaskTitleContent({ task }: { task: TaskWithIndex }) {
  return (
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
  );
}

function isMobileViewport() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? !window.matchMedia("(min-width: 640px)").matches
    : false;
}
