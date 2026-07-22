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
import { OPEN_TASK_CREATE_EVENT } from "../hooks/useTaskKeyboardNavigation";

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
  canCreateTask: boolean;
  selectedTaskId?: string | null;
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
  canCreateTask,
  selectedTaskId,
}: Props) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const columnWidth = useKanbanColumnWidth();

  const containerId = status.value;
  const title = status.label;

  const { items: visibleTasks, placeholderIndex } = projectItemsWithPlaceholder({
    items: tasks,
    getId: (task) => task.id,
    draggedItemId,
    targetLocation,
    containerId,
  });

  const canCreateTasksInColumn = Boolean(canCreateTask && onCreateTask);
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

  useEffect(() => {
    const element = columnRef.current;
    if (!element || !onCreateTask || !canCreateTask) return;

    const openTaskCreator = () => {
      setIsCreating(true);
    };

    element.addEventListener(OPEN_TASK_CREATE_EVENT, openTaskCreator);

    return () => {
      element.removeEventListener(OPEN_TASK_CREATE_EVENT, openTaskCreator);
    };
  }, [canCreateTask, onCreateTask]);

  return (
    <div
      ref={!disableDnD ? columnRef : null}
      className="relative flex flex-col gap-3 bg-surface-dimmed min-h-[72vh] flex-shrink-0 p-3 rounded-lg dark:border dark:border-stroke-base"
      style={{ width: columnWidth }}
      data-test-id={createTestId("kanban-column", status.value)}
    >
      <div
        ref={dragHandleRef}
        className={classNames(
          "flex items-center justify-between px-1 min-h-[28px]",
          isStatusDraggable && "cursor-grab active:cursor-grabbing",
        )}
        data-test-id={createTestId("kanban-column-header", status.value)}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {!hideStatusIcon && (
            <StatusSelector status={status} statusOptions={allStatuses} onChange={() => {}} readonly={true} size="sm" />
          )}
          <span className="truncate text-sm font-semibold text-content-base">{title}</span>
          <span
            className="rounded-full border border-surface-outline bg-surface-base px-1.5 py-0.5 text-xs font-medium tabular-nums text-content-dimmed"
            data-test-id={createTestId("kanban-column-task-count", status.value)}
          >
            {tasks.length}
          </span>
        </div>

        <ColumnMenu
          status={status}
          canManageStatuses={canManageStatuses}
          onEditStatus={onEditStatus}
          onDeleteStatus={onDeleteStatus}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          {visibleTasks.map((task, index) => (
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
                selected={selectedTaskId === task.id}
              />
            </React.Fragment>
          ))}

          {!disableDnD && placeholderIndex !== null && placeholderIndex === visibleTasks.length && (
            <DropPlaceholder containerId={containerId} index={visibleTasks.length} height={placeholderHeight} />
          )}

          <TaskCreationForm
            onCreateTask={onCreateTask}
            statusValue={status.value}
            isCreating={isCreating}
            onModeChange={setIsCreating}
            canCreateTask={canCreateTasksInColumn}
          />
        </div>
      </div>
    </div>
  );
}

interface TaskCreationFormProps {
  onCreateTask?: (title: string) => void;
  statusValue: string;
  isCreating: boolean;
  onModeChange: (isCreating: boolean) => void;
  canCreateTask: boolean;
}

function TaskCreationForm({
  onCreateTask,
  statusValue,
  isCreating,
  onModeChange,
  canCreateTask = true,
}: TaskCreationFormProps) {
  const [title, setTitle] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleModeChange = (creating: boolean) => {
    onModeChange(creating);
  };

  const handleCreate = () => {
    if (title.trim() && onCreateTask) {
      onCreateTask(title.trim());
      setTitle("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      handleModeChange(false);
      setTitle("");
    }
  };

  if (!canCreateTask) {
    return null;
  }

  if (isCreating) {
    return (
      <div className="bg-surface-base p-2 rounded border border-surface-outline shadow-sm mt-2">
        <input
          ref={inputRef}
          autoFocus
          type="text"
          placeholder="What needs to be done?"
          className="w-full text-sm bg-transparent border-none focus:ring-0 p-0 mb-2 text-content-base placeholder:text-content-subtle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          data-test-id={createTestId("new-task-title", statusValue)}
        />
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 text-xs font-medium text-white bg-accent-blue rounded hover:bg-accent-blue-dimmed"
            onClick={handleCreate}
            data-test-id={createTestId("new-task-submit", statusValue)}
          >
            Add
          </button>
          <button
            className="px-2 py-1 text-xs font-medium text-content-dimmed hover:text-content-base"
            onClick={() => {
              handleModeChange(false);
              setTitle("");
            }}
            data-test-id={createTestId("new-task-cancel", statusValue)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (onCreateTask) {
    return (
      <button
        className="flex w-full items-center gap-1.5 rounded px-2 py-2 text-left text-sm font-medium text-content-dimmed transition-colors hover:bg-surface-base hover:text-content-base"
        onClick={() => handleModeChange(true)}
        data-test-id={createTestId("add-task-button", statusValue)}
      >
        <span className="text-lg leading-none" aria-hidden="true">
          +
        </span>
        Add task
      </button>
    );
  }

  return null;
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

function useKanbanColumnWidth() {
  const [pageWidth, setPageWidth] = React.useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => setPageWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const sidePaddingsPx = 2.5 * 16;
  const gapsPx = 2.25 * 16;

  const width = (pageWidth - sidePaddingsPx - gapsPx) / 4;
  return Math.max(290, Math.min(width, 450)); // 290px min, 450px max
}
