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
  targetLocation: BoardLocation | null;
  placeholderHeight: number | null;
  onCreateTask?: (title: string) => void;
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
  targetLocation,
  placeholderHeight,
  onCreateTask,
}: ColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");

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
  const shouldCenterEmptyState = isColumnEmpty && placeholderIndex === null && !isDraggingOverThisColumn && !isCreating;
  const shouldShowEmptyPlaceholder = isColumnEmpty && !isDraggingOverThisColumn && !isCreating;
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

  const handleCreateTask = () => {
    if (newTaskTitle.trim() && onCreateTask) {
      onCreateTask(newTaskTitle.trim());
      setNewTaskTitle("");
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateTask();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewTaskTitle("");
    }
  };

  return (
    <div
      ref={columnRef}
      className="relative flex flex-col gap-2 bg-surface-dimmed min-h-[75vh] w-[320px] flex-shrink-0 p-3 rounded-lg"
      data-test-id={`kanban-column-${status}`}
    >
      <div className="flex items-center justify-between text-xs font-semibold text-content-dimmed uppercase tracking-wide px-1">
        <span>{title}</span>
      </div>

      <div className="flex-1 flex flex-col">
        <div
          className={classNames("space-y-2 flex-1", {
            "flex items-center": shouldCenterEmptyState,
          })}
        >
          {visibleTasks.length > 0
            ? visibleTasks.map((task, index) => (
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
            : shouldShowEmptyPlaceholder && (
                <div
                  className={classNames(
                    "w-full text-center text-xs text-content-subtle py-4 bg-surface-base rounded-md",
                    "border border-dashed border-surface-outline max-w-[220px] mx-auto",
                  )}
                >
                  Drop tasks here
                </div>
              )}

          {placeholderIndex !== null && placeholderIndex === visibleTasks.length && (
            <DropPlaceholder containerId={containerId} index={visibleTasks.length} height={placeholderHeight} />
          )}
        </div>

        {isCreating ? (
          <div className="bg-surface-base p-2 rounded border border-surface-outline shadow-sm mt-2">
            <input
              autoFocus
              type="text"
              placeholder="What needs to be done?"
              className="w-full text-sm bg-transparent border-none focus:ring-0 p-0 mb-2 text-content-base placeholder:text-content-subtle"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 text-xs font-medium text-white bg-accent-blue rounded hover:bg-accent-blue-dimmed"
                onClick={handleCreateTask}
              >
                Add
              </button>
              <button
                className="px-2 py-1 text-xs font-medium text-content-dimmed hover:text-content-base"
                onClick={() => {
                  setIsCreating(false);
                  setNewTaskTitle("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          onCreateTask && (
            <button
              className="flex items-center gap-1.5 text-xs text-content-dimmed hover:text-content-base px-2 py-1.5 rounded hover:bg-surface-highlight transition-colors w-full text-left mt-2"
              onClick={() => setIsCreating(true)}
              data-test-id={`add-task-button-${status}`}
            >
              <span className="text-lg leading-none">+</span>
              Add new task
            </button>
          )
        )}
      </div>
    </div>
  );
}
