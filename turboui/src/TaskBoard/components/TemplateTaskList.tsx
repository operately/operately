import React from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

import { TaskRow } from "../../TemplateProjectPage/TaskRow";
import type { TemplateProjectPage } from "../../TemplateProjectPage";
import { projectItemsWithPlaceholder, SubtleDropPlaceholder, useBoardDnD } from "../../utils/PragmaticDragAndDrop";
import type { BoardLocation, BoardMove } from "../../utils/PragmaticDragAndDrop";
import classNames from "../../utils/classnames";

const ROOT_TASKS_CONTAINER_ID = "no-milestone";

export function TemplateTaskList({
  tasks,
  destinationMilestoneId,
  canEdit,
  onTaskReorder,
  taskRowProps,
  onTaskOpen,
  inlineCreateRow,
  emptyState,
  dragState,
  highlighted = false,
}: TemplateTaskListProps) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const dropContainerId = destinationMilestoneId ?? ROOT_TASKS_CONTAINER_ID;

  // Root tasks have no persisted order; skip between-task drop placeholders.
  const isRootSection = destinationMilestoneId === null;

  const isDraggingEnabled = canEdit && Boolean(onTaskReorder);
  const usesExternalDragState = Boolean(dragState);
  const handleTaskMove = React.useCallback(
    (move: BoardMove) => {
      if (!isDraggingEnabled || usesExternalDragState) return;

      const milestoneId =
        move.destination.containerId === ROOT_TASKS_CONTAINER_ID ? null : move.destination.containerId;
      onTaskReorder?.(move.itemId, milestoneId, move.destination.index);
    },
    [isDraggingEnabled, onTaskReorder, usesExternalDragState],
  );
  const internalDrag = useBoardDnD(handleTaskMove, { enabled: isDraggingEnabled && !usesExternalDragState });
  const draggedItemId = dragState ? dragState.draggedItemId : internalDrag.draggedItemId;
  const destination = dragState ? dragState.destination : internalDrag.destination;
  const placeholderHeight = dragState
    ? dragState.placeholderHeight
    : (internalDrag.draggedItemDimensions?.height ?? null);
  const { items: projectedTasks, placeholderIndex } = React.useMemo(
    () =>
      projectItemsWithPlaceholder({
        items: tasks,
        getId: (task) => task.id,
        draggedItemId: isDraggingEnabled ? draggedItemId : null,
        // Root section highlights as a whole in TaskBoard; do not project indexed gaps.
        targetLocation: isDraggingEnabled && !isRootSection ? destination : null,
        containerId: dropContainerId,
      }),
    [destination, draggedItemId, dropContainerId, isDraggingEnabled, isRootSection, tasks],
  );

  React.useEffect(() => {
    if (!isDraggingEnabled || usesExternalDragState) return;
    const element = listRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ containerId: dropContainerId, index: projectedTasks.length }),
    });
  }, [dropContainerId, isDraggingEnabled, projectedTasks.length, usesExternalDragState]);

  return (
    <div
      ref={listRef}
      className={classNames("overflow-hidden rounded-b-lg", highlighted ? "bg-transparent" : "bg-surface-base")}
    >
      {projectedTasks.map((task, index) => (
        <React.Fragment key={task.id}>
          {placeholderIndex === index ? (
            <SubtleDropPlaceholder containerId={dropContainerId} index={index} height={placeholderHeight} />
          ) : null}
          <TaskRow
            task={task}
            props={taskRowProps}
            canEdit={canEdit}
            onClick={onTaskOpen ? () => onTaskOpen(task.id) : undefined}
            index={index}
            containerId={dropContainerId}
            isDraggable={isDraggingEnabled}
          />
        </React.Fragment>
      ))}
      {placeholderIndex !== null && placeholderIndex === projectedTasks.length ? (
        <SubtleDropPlaceholder containerId={dropContainerId} index={projectedTasks.length} height={placeholderHeight} />
      ) : null}
      {tasks.length === 0 && placeholderIndex === null && emptyState}
      {tasks.length > 0 ? inlineCreateRow : null}
    </div>
  );
}

export interface TemplateTaskListProps {
  tasks: TemplateProjectPage.Task[];
  destinationMilestoneId: string | null;
  canEdit: boolean;
  onTaskReorder?: (
    taskId: string,
    milestoneId: string | null,
    destinationIndex: number,
  ) => void | boolean | Promise<void | boolean>;
  taskRowProps: TemplateProjectPage.Props;
  onTaskOpen?: (taskId: string | null) => void;
  inlineCreateRow?: React.ReactNode;
  emptyState?: React.ReactNode;
  dragState?: {
    draggedItemId: string | null;
    destination: BoardLocation | null;
    placeholderHeight: number | null;
  };
  highlighted?: boolean;
}
