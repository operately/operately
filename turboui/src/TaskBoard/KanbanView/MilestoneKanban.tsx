import React, { useMemo } from "react";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";

import { IconPlus } from "../../icons";
import { createTestId } from "../../TestableElement";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";
import { Column } from "./Column";
import type { KanbanStatus } from "./types";
import { StatusSelector } from "../../StatusSelector";
import { useHorizontalAutoScroll, useSortableItem, DropIndicator } from "../../utils/PragmaticDragAndDrop";
import type { BoardLocation } from "../../utils/PragmaticDragAndDrop";
import classNames from "../../utils/classnames";

interface MilestoneKanbanProps {
  milestone: TaskBoard.Milestone | null;
  columns: Record<KanbanStatus, TaskBoard.Task[]>;
  draggedItemId: string | null;
  targetLocation: BoardLocation | null;
  placeholderHeight: number | null;
  statuses: StatusSelector.StatusOption[];
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
  onTaskCreate?: TaskBoardProps["onTaskCreate"];
  canManageStatuses?: boolean;
  onAddStatusClick?: () => void;
  onEditStatus?: (status: StatusSelector.StatusOption) => void;
  onDeleteStatus?: (status: StatusSelector.StatusOption) => void;
  onTaskClick: (taskId: string) => void;
}

export function MilestoneKanban({
  milestone,
  columns,
  draggedItemId,
  targetLocation,
  placeholderHeight,
  statuses,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  assigneePersonSearch,
  onTaskCreate,
  canManageStatuses,
  onAddStatusClick,
  onEditStatus,
  onDeleteStatus,
  onTaskClick,
}: MilestoneKanbanProps) {
  const testId = useMemo(
    () => (milestone ? createTestId("milestone", milestone.id) : "kanban-no-milestone"),
    [milestone],
  );
  const scrollContainerRef = useHorizontalAutoScroll();

  const unknownStatus = statuses.find((status) => status.value === "unknown-status");
  const regularStatuses = statuses.filter((status) => status.value !== "unknown-status");

  const handleTaskCreate = (title: string, statusValue: string) => {
    if (!onTaskCreate) return;

    const status = statuses.find((s) => s.value === statusValue);

    onTaskCreate({
      title,
      milestone,
      dueDate: null,
      assignee: null,
      status: status,
    });
  };

  return (
    <section className="bg-surface-base min-h-[80vh]" data-test-id={testId}>
      <div ref={scrollContainerRef} className="px-3 pt-3 pb-6 overflow-x-auto h-[80vh]">
        <div className="flex gap-3 min-w-max items-start">
          {unknownStatus && (
            <Column
              status={unknownStatus}
              tasks={columns[unknownStatus.value] || []}
              draggedItemId={draggedItemId}
              targetLocation={targetLocation}
              placeholderHeight={placeholderHeight}
              onTaskAssigneeChange={onTaskAssigneeChange}
              onTaskDueDateChange={onTaskDueDateChange}
              assigneePersonSearch={assigneePersonSearch}
              onCreateTask={undefined}
              dragHandleRef={undefined}
              isStatusDraggable={false}
              allStatuses={statuses}
              canManageStatuses={false}
              onEditStatus={undefined}
              onDeleteStatus={undefined}
              onTaskClick={onTaskClick}
              hideStatusIcon
              disableDnD
            />
          )}

          {regularStatuses.map((status, index) => (
            <SortableStatusColumn
              key={status.value}
              status={status}
              index={index}
              canReorder={Boolean(canManageStatuses)}
            >
              {(dragHandleRef) => (
                <Column
                  status={status}
                  tasks={columns[status.value] || []}
                  draggedItemId={draggedItemId}
                  targetLocation={targetLocation}
                  placeholderHeight={placeholderHeight}
                  onTaskAssigneeChange={onTaskAssigneeChange}
                  onTaskDueDateChange={onTaskDueDateChange}
                  assigneePersonSearch={assigneePersonSearch}
                  onCreateTask={onTaskCreate ? (title) => handleTaskCreate(title, status.value) : undefined}
                  dragHandleRef={dragHandleRef}
                  isStatusDraggable={Boolean(canManageStatuses)}
                  allStatuses={statuses}
                  canManageStatuses={canManageStatuses}
                  onEditStatus={onEditStatus}
                  onDeleteStatus={onDeleteStatus}
                  onTaskClick={onTaskClick}
                />
              )}
            </SortableStatusColumn>
          ))}

          {canManageStatuses && (
            <button
              type="button"
              onClick={onAddStatusClick}
              className="flex flex-col items-center justify-start gap-1.5 px-2 py-2 rounded-md border border-dashed border-surface-outline text-content-dimmed hover:border-brand-1/60 hover:text-brand-1 transition min-w-[100px] h-full"
              data-test-id={"add-status"}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-dimmed">
                <IconPlus size={14} />
              </span>
              <span className="text-xs font-medium mt-0.5">Add status</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

interface SortableStatusColumnProps {
  status: StatusSelector.StatusOption;
  index: number;
  canReorder: boolean;
  children: (dragHandleRef: React.RefObject<HTMLDivElement>) => React.ReactNode;
}

function SortableStatusColumn({ status, index, canReorder, children }: SortableStatusColumnProps) {
  const { ref, dragHandleRef, isDragging, closestEdge } = useSortableItem({
    itemId: status.value,
    index,
    containerId: "status-columns",
    scope: "status-columns",
    disabled: !canReorder,
    allowedEdges: ["left", "right"],
  });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={classNames("relative flex-shrink-0", isDragging && "z-10")}
    >
      {closestEdge && <DropIndicator edge={closestEdge as Edge} />}
      {children(dragHandleRef as React.RefObject<HTMLDivElement>)}
    </div>
  );
}
