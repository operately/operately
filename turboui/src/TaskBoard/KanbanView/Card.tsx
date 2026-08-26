import React, { useCallback, useEffect, useState } from "react";
import { IconFileText, IconGripVertical, IconMessageCircle } from "../../icons";
import { DateField } from "../../DateField";
import { RelativeDayField } from "../../RelativeDayField";
import { AssigneesField } from "../../AssigneesField";
import classNames from "../../utils/classnames";
import { DropIndicator, useSortableItem } from "../../utils/PragmaticDragAndDrop";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";
import { createTestId } from "../../TestableElement";
import {
  OPEN_TASK_ASSIGNEE_EVENT,
  OPEN_TASK_DUE_DATE_EVENT,
  OPEN_TASK_EVENT,
} from "../hooks/useTaskKeyboardNavigation";
import { useShortcutFieldFocusRestore } from "../hooks/useShortcutFieldFocusRestore";

interface CardProps {
  task: TaskBoard.Task;
  containerId: string;
  index: number;
  draggedItemId: string | null;
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  onTaskDueOffsetDaysChange?: TaskBoardProps["onTaskDueOffsetDaysChange"];
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
  onTaskDueOffsetDaysChange,
  assigneePersonSearch,
  showDropIndicator = true,
  onTaskClick,
  selected = false,
}: CardProps) {
  const [currentAssignees, setCurrentAssignees] = useState<TaskBoard.Person[]>(task.assignees || []);
  const [currentDueDate, setCurrentDueDate] = useState<DateField.ContextualDate | null>(task.dueDate || null);
  const [currentDueOffsetDays, setCurrentDueOffsetDays] = useState<number | null>(task.dueOffsetDays ?? null);
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
      if (usesRelativeDueDate(task)) {
        if (!onTaskDueOffsetDaysChange) return;
      } else if (!onTaskDueDateChange) {
        return;
      }

      prepareFocusRestore();
      setDueDateFieldOpen(true);
    };

    const openTask = () => {
      onTaskClick?.(task.id);
    };

    element.addEventListener(OPEN_TASK_ASSIGNEE_EVENT, openAssigneeField);
    element.addEventListener(OPEN_TASK_DUE_DATE_EVENT, openDueDateField);
    element.addEventListener(OPEN_TASK_EVENT, openTask);
    return () => {
      element.removeEventListener(OPEN_TASK_ASSIGNEE_EVENT, openAssigneeField);
      element.removeEventListener(OPEN_TASK_DUE_DATE_EVENT, openDueDateField);
      element.removeEventListener(OPEN_TASK_EVENT, openTask);
    };
  }, [
    assigneePersonSearch,
    onTaskClick,
    onTaskDueDateChange,
    onTaskDueOffsetDaysChange,
    prepareFocusRestore,
    ref,
    task.dueOffsetDays,
    task.id,
  ]);

  useEffect(() => {
    setCurrentAssignees(task.assignees || []);
  }, [task.assignees, task.id]);

  useEffect(() => {
    setCurrentDueDate(task.dueDate || null);
    setCurrentDueOffsetDays(task.dueOffsetDays ?? null);
  }, [task.dueDate, task.dueOffsetDays, task.id]);

  const handleAssigneesChange = useCallback(
    (newAssignees: TaskBoard.Person[]) => {
      setCurrentAssignees(newAssignees);
      onTaskAssigneeChange?.(task.id, newAssignees);
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

  const handleDueOffsetDaysChange = useCallback(
    (dueOffsetDays: number | null) => {
      setCurrentDueOffsetDays(dueOffsetDays);
      onTaskDueOffsetDaysChange?.(task.id, dueOffsetDays);
    },
    [onTaskDueOffsetDaysChange, task.id],
  );

  const isDimmed = draggedItemId === task.id;
  const dropIndicatorEdge = showDropIndicator ? closestEdge : null;
  const shouldShowDescriptionIndicator = Boolean(task.hasDescription);
  const shouldShowCommentsIndicator = Boolean(task.hasComments);
  const shouldShowCommentCount = task.commentCount !== undefined;
  const hasDueDate = usesRelativeDueDate(task) ? currentDueOffsetDays !== null : Boolean(currentDueDate);
  const dateFieldClassName = classNames({
    "[&>span]:text-transparent": !hasDueDate,
    "group-hover:[&>span]:text-content-dimmed": !hasDueDate,
    "group-focus-within:[&>span]:text-content-dimmed": !hasDueDate,
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
        "relative rounded-lg border bg-surface-base px-3.5 py-3 shadow-xs group w-full cursor-grab focus-visible:outline-none transition-[border-color,box-shadow] hover:border-surface-outline hover:shadow-sm",
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
      <div className="flex items-start gap-2">
        <IconGripVertical
          size={16}
          className="mt-0.5 flex-shrink-0 text-content-subtle opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div onMouseDown={stopDragFromInteractive}>
            <div
              className="block text-[15px] font-medium leading-5 text-content-base hover:text-link-hover transition-colors break-words cursor-pointer hover:underline"
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

          <div className="flex items-center justify-between gap-2 text-xs text-content-dimmed leading-4">
            <div className="flex items-center gap-2">
              {shouldShowDescriptionIndicator && (
                <span
                  className="inline-flex items-center gap-1"
                  title="Has description"
                  data-test-id="description-indicator"
                >
                  <IconFileText size={14} />
                </span>
              )}

              {shouldShowCommentsIndicator && (
                <span className="inline-flex items-center gap-1" title="Has comments" data-test-id="comments-indicator">
                  <IconMessageCircle size={14} />
                  {shouldShowCommentCount && <span>{task.commentCount}</span>}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div onMouseDown={stopDragFromInteractive}>
                {usesRelativeDueDate(task) ? (
                  <RelativeDayField
                    value={currentDueOffsetDays}
                    onChange={onTaskDueOffsetDaysChange ? handleDueOffsetDaysChange : undefined}
                    variant="inline"
                    hideCalendarIcon={true}
                    placeholder={hasDueDate ? "" : "Set when due"}
                    readonly={!onTaskDueOffsetDaysChange}
                    className={dateFieldClassName}
                    testId={createTestId("kanban-card-due-offset", task.id)}
                    isOpen={dueDateFieldOpen}
                    onOpenChange={handleDueDateFieldOpenChange}
                  />
                ) : (
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
                )}
              </div>

              <div onMouseDown={stopDragFromInteractive}>
                <AssigneesField
                  people={currentAssignees}
                  setPeople={handleAssigneesChange}
                  avatarSize={24}
                  avatarOnly={true}
                  {...(assigneePersonSearch ? { searchData: assigneePersonSearch } : { readonly: true as const })}
                  testId={createTestId("kanban-card-assignee", task.id)}
                  isOpen={assigneeFieldOpen}
                  onOpenChange={handleAssigneeFieldOpenChange}
                  onCloseAutoFocus={restoreFocusOnCloseAutoFocus}
                />
                {currentAssignees.map((assignee) => (
                  <span
                    key={assignee.id}
                    className="sr-only"
                    data-test-id={createTestId("kanban-card-assignee-name", task.id)}
                  >
                    {assignee.fullName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function usesRelativeDueDate(task: TaskBoard.Task): boolean {
  return task.dueOffsetDays !== undefined;
}
