import React, { useEffect, useRef } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import classNames from "../../utils/classnames";
import { Card } from "./Card";
import type { KanbanStatus } from "./types";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";

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
}: ColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({
        containerId,
        index: tasks.length,
      }),
    });
  }, [containerId, tasks.length]);

  return (
    <div
      ref={columnRef}
      className="relative flex flex-col gap-2 bg-transparent min-h-[240px] w-[320px] flex-shrink-0"
      data-test-id={`kanban-column-${status}`}
    >
      {!isFirst && (
        <div className="absolute top-4 bottom-4 -ml-[6px] w-px bg-surface-outline/30 border-r border-dashed border-surface-outline/60 pointer-events-none" />
      )}
      <div className="flex items-center justify-between text-xs font-semibold text-content-dimmed uppercase tracking-wide px-1">
        <span>{title}</span>
      </div>

      <div className={classNames("space-y-2 flex-1", { "flex items-center": tasks.length === 0 })}>
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <Card
              key={task.id}
              task={task}
              containerId={containerId}
              index={index}
              draggedItemId={draggedItemId}
              onTaskAssigneeChange={onTaskAssigneeChange}
              onTaskDueDateChange={onTaskDueDateChange}
              assigneePersonSearch={assigneePersonSearch}
            />
          ))
        ) : (
          <div
            className={[
              "w-full text-center text-xs text-content-subtle py-4 bg-surface-base rounded-md",
              "border border-dashed border-surface-outline max-w-[220px] mx-auto",
            ].join(" ")}
          >
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
