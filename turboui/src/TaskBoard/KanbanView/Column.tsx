import React, { useEffect, useRef } from "react";
import { StatusSelector } from "../../StatusSelector";
import { Menu, MenuActionItem } from "../../Menu";
import { IconPencil, IconDots, IconTrash } from "../../icons";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import classNames from "../../utils/classnames";
import { Card } from "./Card";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";
import { DropPlaceholder, projectItemsWithPlaceholder } from "../../utils/PragmaticDragAndDrop";
import type { BoardLocation } from "../../utils/PragmaticDragAndDrop";
import { createTestId } from "../../TestableElement";

interface Props {
  status: StatusSelector.StatusOption;
  tasks: TaskBoard.Task[];
  draggedItemId: string | null;
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
  targetLocation: BoardLocation | null;
  placeholderHeight: number | null;
  onCreateTask?: (title: string) => void;
  dragHandleRef?: React.RefObject<HTMLDivElement>;
  isStatusDraggable?: boolean;
  allStatuses: StatusSelector.StatusOption[];
  canManageStatuses?: boolean;
  onEditStatus?: (status: StatusSelector.StatusOption) => void;
  onDeleteStatus?: (status: StatusSelector.StatusOption) => void;
  hideStatusIcon?: boolean;
  disableDnD?: boolean;
  onTaskClick?: (taskId: string) => void;
}

export function Column({
  status,
  tasks,
  draggedItemId,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  assigneePersonSearch,
  targetLocation,
  placeholderHeight,
  onCreateTask,
  dragHandleRef,
  isStatusDraggable,
  allStatuses,
  canManageStatuses,
  onEditStatus,
  onDeleteStatus,
  hideStatusIcon,
  disableDnD,
  onTaskClick,
}: Props) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");

  const containerId = status.value;
  const title = status.label;

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
  const shouldShowEmptyPlaceholder = isColumnEmpty && !isDraggingOverThisColumn && !isCreating && !disableDnD;
  const effectivePlaceholderIndex = disableDnD ? null : placeholderIndex;
  const shouldShowDropIndicator = !disableDnD && placeholderIndex === null;

  useEffect(() => {
    if (disableDnD) return;

    const element = columnRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({
        containerId,
        index: visibleTasks.length,
      }),
    });
  }, [disableDnD, containerId, visibleTasks.length]);

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
      ref={!disableDnD ? columnRef : null}
      className="relative flex flex-col gap-2 bg-surface-dimmed min-h-[78vh] w-[320px] flex-shrink-0 p-3 rounded-lg"
      data-test-id={createTestId("kanban-column", status.value)}
    >
      <div
        ref={dragHandleRef}
        className={classNames(
          "flex items-center justify-between text-xs font-semibold text-content-dimmed uppercase tracking-wide px-1 min-h-[24px]",
          isStatusDraggable && "cursor-grab active:cursor-grabbing",
        )}
        data-test-id={createTestId("kanban-column-header", status.value)}
      >
        <div className="flex items-center gap-1.5">
          {!hideStatusIcon && (
            <StatusSelector status={status} statusOptions={allStatuses} onChange={() => {}} readonly={true} size="sm" />
          )}
          <span>{title}</span>
        </div>

        <ColumnMenu
          status={status}
          canManageStatuses={canManageStatuses}
          onEditStatus={onEditStatus}
          onDeleteStatus={onDeleteStatus}
        />
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
                  {effectivePlaceholderIndex === index && (
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
                    onTaskClick={onTaskClick}
                  />
                </React.Fragment>
              ))
            : shouldShowEmptyPlaceholder && (
                <div
                  className={classNames(
                    "w-full text-center text-xs text-content-subtle py-4 bg-surface-dimmed rounded-md",
                    "border border-dashed border-surface-outline max-w-[220px] mx-auto",
                  )}
                >
                  Drop tasks here
                </div>
              )}

          {!disableDnD && placeholderIndex !== null && placeholderIndex === visibleTasks.length && (
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
              data-test-id={createTestId("new-task-title", status.value)}
            />
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 text-xs font-medium text-white bg-accent-blue rounded hover:bg-accent-blue-dimmed"
                onClick={handleCreateTask}
                data-test-id={createTestId("new-task-submit", status.value)}
              >
                Add
              </button>
              <button
                className="px-2 py-1 text-xs font-medium text-content-dimmed hover:text-content-base"
                onClick={() => {
                  setIsCreating(false);
                  setNewTaskTitle("");
                }}
                data-test-id={createTestId("new-task-cancel", status.value)}
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
              data-test-id={createTestId("add-task-button", status.value)}
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

interface MenuProps {
  status: StatusSelector.StatusOption;
  canManageStatuses?: boolean;
  onEditStatus?: (status: StatusSelector.StatusOption) => void;
  onDeleteStatus?: (status: StatusSelector.StatusOption) => void;
}

function ColumnMenu({ status, canManageStatuses, onEditStatus, onDeleteStatus }: MenuProps) {
  if (!canManageStatuses) return null;

  return (
    <div className="flex items-center">
      <Menu
        align="end"
        size="tiny"
        customTrigger={
          <button
            className="block p-1 text-content-dimmed hover:text-content-base hover:bg-surface-dimmed rounded-full data-[state=open]:bg-surface-dimmed"
            data-test-id={createTestId("status-menu-trigger", status.value)}
          >
            <IconDots size={16} />
          </button>
        }
      >
        <MenuActionItem
          onClick={() => onEditStatus && onEditStatus(status)}
          icon={IconPencil}
          testId={createTestId("edit-status", status.value)}
        >
          Edit
        </MenuActionItem>
        <MenuActionItem
          onClick={() => onDeleteStatus && onDeleteStatus(status)}
          icon={IconTrash}
          danger
          testId={createTestId("delete-status", status.value)}
        >
          Delete
        </MenuActionItem>
      </Menu>
    </div>
  );
}
