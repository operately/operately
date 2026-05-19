import React, { useCallback, useEffect, useState } from "react";
import { IconFileText, IconMessageCircle } from "../../icons";
import { DateField } from "../../DateField";
import { PersonField } from "../../PersonField";
import classNames from "../../utils/classnames";
import { DropIndicator, useSortableItem } from "../../utils/PragmaticDragAndDrop";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";
import { createTestId } from "../../TestableElement";
import {
  OPEN_TASK_ASSIGNEE_EVENT,
  OPEN_TASK_DUE_DATE_EVENT,
} from "../hooks/useTaskKeyboardNavigation";
import { useShortcutFieldFocusRestore } from "../hooks/useShortcutFieldFocusRestore";

interface CardProps {
  task: TaskBoard.Task;
  containerId: string;
  index: number;
  draggedItemId: string | null;
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
  showDropIndicator?: boolean;
  onTaskClick?: (taskId: string) => void;
  selected?: boolean;
}

export function Card({
  task,
  containerId,
  index,
  draggedItemId,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  assigneePersonSearch,
  showDropIndicator = true,
  onTaskClick,
  selected = false,
}: CardProps) {
  const [currentAssignee, setCurrentAssignee] = useState<TaskBoard.Person | null>(task.assignees?.[0] || null);
  const [currentDueDate, setCurrentDueDate] = useState<DateField.ContextualDate | null>(task.dueDate || null);
  const [assigneeFieldOpen, setAssigneeFieldOpen] = useState(false);
  const [dueDateFieldOpen, setDueDateFieldOpen] = useState(false);
  const { ref, isDragging, closestEdge } = useSortableItem({
    itemId: task.id,
    index,
    containerId,
  });
  const { prepareFocusRestore, restoreFocusAfterOpenChange, restoreFocusOnCloseAutoFocus } =
    useShortcutFieldFocusRestore(ref);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const openAssigneeField = () => {
      if (!assigneePersonSearch) return;

      prepareFocusRestore();
      setAssigneeFieldOpen(true);
    };

    const openDueDateField = () => {
      if (!onTaskDueDateChange) return;

      prepareFocusRestore();
      setDueDateFieldOpen(true);
    };

    element.addEventListener(OPEN_TASK_ASSIGNEE_EVENT, openAssigneeField);
    element.addEventListener(OPEN_TASK_DUE_DATE_EVENT, openDueDateField);
    return () => {
      element.removeEventListener(OPEN_TASK_ASSIGNEE_EVENT, openAssigneeField);
      element.removeEventListener(OPEN_TASK_DUE_DATE_EVENT, openDueDateField);
    };
  }, [assigneePersonSearch, onTaskDueDateChange, prepareFocusRestore, ref]);

  useEffect(() => {
    setCurrentAssignee(task.assignees?.[0] || null);
  }, [task.assignees, task.id]);

  useEffect(() => {
    setCurrentDueDate(task.dueDate || null);
  }, [task.dueDate, task.id]);

  const handleAssigneeChange = useCallback(
    (newAssignee: TaskBoard.Person | null) => {
      setCurrentAssignee(newAssignee);
      onTaskAssigneeChange?.(task.id, newAssignee);
    },
    [onTaskAssigneeChange, task.id],
  );

  const handleDueDateChange = useCallback(
    (newDueDate: DateField.ContextualDate | null) => {
      setCurrentDueDate(newDueDate);
      onTaskDueDateChange?.(task.id, newDueDate);
    },
    [onTaskDueDateChange, task.id],
  );

  const isDimmed = draggedItemId === task.id;
  const dropIndicatorEdge = showDropIndicator ? closestEdge : null;
  const shouldShowDescriptionIndicator = Boolean(task.hasDescription);
  const shouldShowCommentsIndicator = Boolean(task.hasComments);
  const shouldShowCommentCount = task.commentCount !== undefined;
  const dateFieldClassName = classNames({
    "[&>span]:text-transparent": !currentDueDate,
    "group-hover:[&>span]:text-content-dimmed": !currentDueDate,
    "group-focus-within:[&>span]:text-content-dimmed": !currentDueDate,
  });

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

  const handleDueDateFieldOpenChange = useCallback(
    (isOpen: boolean) => {
      setDueDateFieldOpen(isOpen);
      restoreFocusAfterOpenChange(isOpen);
    },
    [restoreFocusAfterOpenChange],
  );

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={classNames(
        "relative rounded-md border bg-surface-base px-4 py-2 shadow-xs group w-full cursor-grab focus-visible:outline-none transition-colors",
        selected
          ? "border-brand-1 bg-[rgba(224,242,254,0.75)] shadow-[inset_0_0_0_2px_var(--color-brand-1)] dark:bg-[rgba(37,99,235,0.20)]"
          : "border-surface-subtle dark:border-stroke-base",
        {
          "opacity-60": isDimmed,
          "cursor-grabbing": isDragging,
        },
      )}
      data-test-id={createTestId("kanban-card", task.id)}
      data-task-row-id={task.id}
      data-selected={selected ? "true" : "false"}
      tabIndex={-1}
      aria-selected={selected}
    >
      {dropIndicatorEdge && <DropIndicator edge={dropIndicatorEdge} />}
      <div className="flex items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div onMouseDown={stopDragFromInteractive}>
            <div
              className="block text-[13px] text-content-base hover:text-link-hover transition-colors leading-snug break-words cursor-pointer hover:underline"
              title={task.title}
              onClick={(e) => {
                e.preventDefault();
                onTaskClick?.(task.id);
              }}
              data-test-id={createTestId("kanban-card-title", task.id)}
            >
              {task.title}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-content-dimmed leading-none">
            <div className="flex items-center gap-2">
              {shouldShowDescriptionIndicator && (
                <span className="inline-flex items-center gap-1" data-test-id="description-indicator">
                  <IconFileText size={12} />
                </span>
              )}

              {shouldShowCommentsIndicator && (
                <span className="inline-flex items-center gap-1" data-test-id="comments-indicator">
                  <IconMessageCircle size={12} />
                  {shouldShowCommentCount && <span>{task.commentCount}</span>}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div onMouseDown={stopDragFromInteractive}>
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
                  className={dateFieldClassName}
                  testId={createTestId("kanban-card-due-date", task.id)}
                  isOpen={dueDateFieldOpen}
                  onOpenChange={handleDueDateFieldOpenChange}
                  onCloseAutoFocus={restoreFocusOnCloseAutoFocus}
                />
              </div>

              <div onMouseDown={stopDragFromInteractive}>
                <PersonField
                  person={currentAssignee}
                  setPerson={handleAssigneeChange}
                  avatarSize={22}
                  avatarOnly={true}
                  {...(assigneePersonSearch ? { searchData: assigneePersonSearch } : { readonly: true as const })}
                  testId={createTestId("kanban-card-assignee", task.id)}
                  isOpen={assigneeFieldOpen}
                  onOpenChange={handleAssigneeFieldOpenChange}
                  onCloseAutoFocus={restoreFocusOnCloseAutoFocus}
                />
                {currentAssignee && (
                  <span className="sr-only" data-test-id={createTestId("kanban-card-assignee-name", task.id)}>
                    {currentAssignee.fullName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
