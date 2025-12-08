import React, { useCallback, useEffect, useState } from "react";
import { IconFileText, IconMessageCircle } from "../../icons";
import { DateField } from "../../DateField";
import { PersonField } from "../../PersonField";
import classNames from "../../utils/classnames";
import { DropIndicator, useSortableItem } from "../../utils/PragmaticDragAndDrop";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";

interface CardProps {
  task: TaskBoard.Task;
  containerId: string;
  index: number;
  draggedItemId: string | null;
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
  showDropIndicator?: boolean;
  onTaskClick: (taskId: string) => void;
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
}: CardProps) {
  const [currentAssignee, setCurrentAssignee] = useState<TaskBoard.Person | null>(task.assignees?.[0] || null);
  const [currentDueDate, setCurrentDueDate] = useState<DateField.ContextualDate | null>(task.dueDate || null);
  const { ref, isDragging, closestEdge } = useSortableItem({
    itemId: task.id,
    index,
    containerId,
  });

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

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={classNames(
        "relative rounded-md border border-surface-subtle bg-surface-base px-4 py-2 shadow-xs group w-full cursor-grab",
        {
          "opacity-60": isDimmed,
          "cursor-grabbing": isDragging,
        },
      )}
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
                onTaskClick(task.id);
              }}
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
                />
              </div>

              <div onMouseDown={stopDragFromInteractive}>
                <PersonField
                  person={currentAssignee}
                  setPerson={handleAssigneeChange}
                  avatarSize={22}
                  avatarOnly={true}
                  {...(assigneePersonSearch ? { searchData: assigneePersonSearch } : { readonly: true as const })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
