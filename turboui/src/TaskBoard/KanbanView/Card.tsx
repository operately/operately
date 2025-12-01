import React, { useCallback, useEffect, useState } from "react";
import { IconFileText, IconMessageCircle } from "../../icons";
import { DateField } from "../../DateField";
import { BlackLink } from "../../Link";
import { PersonField } from "../../PersonField";
import classNames from "../../utils/classnames";
import { DragHandle, DropIndicator, useSortableItem } from "../../utils/PragmaticDragAndDrop";
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
}: CardProps) {
  const [currentAssignee, setCurrentAssignee] = useState<TaskBoard.Person | null>(task.assignees?.[0] || null);
  const [currentDueDate, setCurrentDueDate] = useState<DateField.ContextualDate | null>(task.dueDate || null);
  const { ref, dragHandleRef, isDragging, closestEdge } = useSortableItem({
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

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={classNames("relative rounded-md border border-surface-subtle bg-surface-base p-2 shadow-xs group w-full", {
        "opacity-60": draggedItemId === task.id,
      })}
    >
      {showDropIndicator && closestEdge && <DropIndicator edge={closestEdge} />}
      <div className="flex items-center gap-2">
        <div ref={dragHandleRef as React.RefObject<HTMLDivElement>} className="pt-0.5 flex-shrink-0">
          <DragHandle isDragging={isDragging} size={12} />
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <BlackLink
            to={task.link}
            className="flex-1 text-[13px] font-semibold text-content-base hover:text-link-hover transition-colors truncate leading-snug"
            underline="hover"
            title={task.title}
          >
            {task.title}
          </BlackLink>

          <div className="flex items-center gap-2 text-[11px] text-content-dimmed leading-none flex-shrink-0">
            {task.hasDescription && (
              <span className="inline-flex items-center gap-1" data-test-id="description-indicator">
                <IconFileText size={12} />
              </span>
            )}

            {task.hasComments && (
              <span className="inline-flex items-center gap-1" data-test-id="comments-indicator">
                <IconMessageCircle size={12} />
                {task.commentCount !== undefined && <span>{task.commentCount}</span>}
              </span>
            )}

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
              className={
                currentDueDate
                  ? ""
                  : [
                      "[&>span]:text-transparent",
                      "group-hover:[&>span]:text-content-dimmed",
                      "group-focus-within:[&>span]:text-content-dimmed",
                    ].join(" ")
              }
            />

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
  );
}
