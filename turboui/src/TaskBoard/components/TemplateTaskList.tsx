import React from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

import { TaskRow } from "../../TemplateProjectPage/TaskRow";
import type { TemplateProjectPage } from "../../TemplateProjectPage";
import { projectItemsWithPlaceholder, SubtleDropPlaceholder, useBoardDnD } from "../../utils/PragmaticDragAndDrop";
import type { BoardMove } from "../../utils/PragmaticDragAndDrop";

export function TemplateTaskList({
  tasks,
  containerId,
  destinationMilestoneId,
  canEdit,
  onTaskReorder,
  taskRowProps,
  onTaskOpen,
  inlineCreateRow,
}: TemplateTaskListProps) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const isDraggingEnabled = canEdit && Boolean(onTaskReorder);
  const handleTaskMove = React.useCallback(
    (move: BoardMove) => {
      onTaskReorder?.(move.itemId, destinationMilestoneId, move.destination.index);
    },
    [destinationMilestoneId, onTaskReorder],
  );
  const { draggedItemId, destination, draggedItemDimensions } = useBoardDnD(handleTaskMove);
  const { items: projectedTasks, placeholderIndex } = React.useMemo(
    () =>
      projectItemsWithPlaceholder({
        items: tasks,
        getId: (task) => task.id,
        draggedItemId: isDraggingEnabled ? draggedItemId : null,
        targetLocation: isDraggingEnabled ? destination : null,
        containerId,
      }),
    [containerId, destination, draggedItemId, isDraggingEnabled, tasks],
  );

  React.useEffect(() => {
    if (!isDraggingEnabled) return;
    const element = listRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ containerId, index: projectedTasks.length }),
    });
  }, [containerId, isDraggingEnabled, projectedTasks.length]);

  return (
    <div ref={listRef} className="overflow-hidden rounded-b-lg bg-surface-base">
      {projectedTasks.map((task, index) => (
        <React.Fragment key={task.id}>
          {placeholderIndex === index && (
            <SubtleDropPlaceholder
              containerId={containerId}
              index={index}
              height={draggedItemDimensions?.height ?? null}
            />
          )}
          <TaskRow
            task={task}
            props={taskRowProps}
            canEdit={canEdit}
            onClick={() => onTaskOpen(task.id)}
            index={index}
            containerId={containerId}
            isDraggable={isDraggingEnabled}
          />
        </React.Fragment>
      ))}
      {placeholderIndex !== null && placeholderIndex === projectedTasks.length && (
        <SubtleDropPlaceholder
          containerId={containerId}
          index={projectedTasks.length}
          height={draggedItemDimensions?.height ?? null}
        />
      )}
      {inlineCreateRow}
    </div>
  );
}

export interface TemplateTaskListProps {
  tasks: TemplateProjectPage.Task[];
  containerId: string;
  destinationMilestoneId: string | null;
  canEdit: boolean;
  onTaskReorder?: (
    taskId: string,
    milestoneId: string | null,
    destinationIndex: number,
  ) => void | boolean | Promise<void | boolean>;
  taskRowProps: TemplateProjectPage.Props;
  onTaskOpen: (taskId: string | null) => void;
  inlineCreateRow?: React.ReactNode;
}
