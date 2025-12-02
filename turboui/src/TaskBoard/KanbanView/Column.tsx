import React, { useEffect, useRef } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import classNames from "../../utils/classnames";
import { Card } from "./Card";
import type { KanbanStatus } from "./types";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";
import { DropPlaceholder, projectItemsWithPlaceholder } from "../../utils/PragmaticDragAndDrop";
import type { BoardLocation } from "../../utils/PragmaticDragAndDrop";

interface ColumnProps {
  title: string;
  status: KanbanStatus;
  containerId: string;
  tasks: TaskBoard.Task[];
  draggedItemId: string | null;
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
  isFirst?: boolean;
  targetLocation: BoardLocation | null;
  placeholderHeight: number | null;
}

export function Column({
  title,
  status,
  containerId,
  tasks,
  draggedItemId,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  assigneePersonSearch,
  isFirst = false,
  targetLocation,
  placeholderHeight,
}: ColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const { items: visibleTasks, placeholderIndex } = projectItemsWithPlaceholder({
    items: tasks,
    getId: (task) => task.id,
    draggedItemId,
    targetLocation,
    containerId,
  });

  const isColumnEmpty = visibleTasks.length === 0;
  const isDraggingOverThisColumn = Boolean(
    draggedItemId && targetLocation && targetLocation.containerId === containerId,
  );
  const shouldCenterEmptyState = isColumnEmpty && placeholderIndex === null && !isDraggingOverThisColumn;
  const shouldShowEmptyPlaceholder = isColumnEmpty && !isDraggingOverThisColumn;
  const shouldShowDropIndicator = placeholderIndex === null;

  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({
        containerId,
        index: visibleTasks.length,
      }),
    });
  }, [containerId, visibleTasks.length]);

  return (
    <div
      ref={columnRef}
      className="relative flex flex-col gap-2 bg-transparent h-full w-[320px] flex-shrink-0"
      data-test-id={`kanban-column-${status}`}
    >
      {!isFirst && (
        <div className="absolute top-4 bottom-4 -ml-[6px] w-px min-h-full bg-surface-outline/30 border-r border-dashed border-surface-outline/60 pointer-events-none" />
      )}
      <div className="flex items-center justify-between text-xs font-semibold text-content-dimmed uppercase tracking-wide px-1">
        <span>{title}</span>
      </div>

      <div
        className={classNames("space-y-2 flex-1", {
          "flex items-center": shouldCenterEmptyState,
        })}
      >
        {visibleTasks.length > 0 ? (
          visibleTasks.map((task, index) => (
            <React.Fragment key={task.id}>
              {placeholderIndex === index && (
                <DropPlaceholder containerId={containerId} index={index} height={placeholderHeight} />
              )}
              <Card
                task={task}
                containerId={containerId}
                index={index}
                draggedItemId={draggedItemId}
                onTaskAssigneeChange={onTaskAssigneeChange}
                onTaskDueDateChange={onTaskDueDateChange}
                assigneePersonSearch={assigneePersonSearch}
                showDropIndicator={shouldShowDropIndicator}
              />
            </React.Fragment>
          ))
        ) : (
          shouldShowEmptyPlaceholder && (
            <div
              className={classNames(
                "w-full text-center text-xs text-content-subtle py-4 bg-surface-base rounded-md",
                "border border-dashed border-surface-outline max-w-[220px] mx-auto",
              )}
            >
              Drop tasks here
            </div>
          )
        )}

        {placeholderIndex !== null && placeholderIndex === visibleTasks.length && (
          <DropPlaceholder containerId={containerId} index={visibleTasks.length} height={placeholderHeight} />
        )}
      </div>
    </div>
  );
}
