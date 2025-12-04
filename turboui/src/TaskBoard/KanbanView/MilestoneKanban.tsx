import React, { useMemo } from "react";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";

import { IconFileText, IconMessageCircle, IconPlus } from "../../icons";
import { DateField } from "../../DateField";
import { BlackLink } from "../../Link";
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
  onMilestoneUpdate?: TaskBoardProps["onMilestoneUpdate"];
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
  onTaskCreate?: TaskBoardProps["onTaskCreate"];
  canManageStatuses?: boolean;
  onAddStatusClick?: () => void;
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
  onMilestoneUpdate,
  assigneePersonSearch,
  onTaskCreate,
  canManageStatuses,
  onAddStatusClick,
}: MilestoneKanbanProps) {
  const testId = useMemo(
    () => (milestone ? createTestId("milestone", milestone.id) : "kanban-no-milestone"),
    [milestone],
  );
  const scrollContainerRef = useHorizontalAutoScroll();

  const handleMilestoneDueDateChange = (newDueDate: DateField.ContextualDate | null) => {
    if (milestone && onMilestoneUpdate) {
      onMilestoneUpdate(milestone.id, { name: milestone.name, dueDate: newDueDate || null });
    }
  };

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
      <header className="flex items-center justify-between gap-3 px-4 pt-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {milestone ? (
            <BlackLink
              to={milestone.link || "#"}
              className="truncate text-sm font-semibold text-content-base hover:text-link-hover transition-colors"
              underline="hover"
              title={milestone.name}
            >
              {milestone.name}
            </BlackLink>
          ) : (
            <span className="text-sm font-semibold text-content-base">No milestone</span>
          )}

          {milestone?.hasDescription && (
            <span className="inline-flex items-center gap-1 text-content-dimmed" data-test-id="description-indicator">
              <IconFileText size={12} />
            </span>
          )}

          {milestone?.hasComments && (
            <span className="inline-flex items-center gap-1 text-content-dimmed" data-test-id="comments-indicator">
              <IconMessageCircle size={12} />
              {milestone.commentCount !== undefined && <span>{milestone.commentCount}</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DateField
            date={milestone?.dueDate || null}
            onDateSelect={handleMilestoneDueDateChange}
            variant="inline"
            showOverdueWarning={true}
            placeholder="Set due date"
            readonly={!milestone || !onMilestoneUpdate}
            size="small"
          />
        </div>
      </header>

      <div ref={scrollContainerRef} className="px-3 pt-3 pb-6 overflow-x-auto h-[80vh]">
        <div className="flex gap-3 min-w-max items-start">
          {statuses.map((status, index) => (
            <SortableStatusColumn
              key={status.value}
              status={status}
              index={index}
              canReorder={Boolean(canManageStatuses)}
            >
              {(dragHandleRef) => (
                <Column
                  title={status.label}
                  status={status.value}
                  containerId={status.value}
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
                />
              )}
            </SortableStatusColumn>
          ))}

          {canManageStatuses && (
            <button
              type="button"
              onClick={onAddStatusClick}
              className="flex flex-col items-center justify-start gap-2 px-3 py-2 rounded-md border border-dashed border-surface-outline text-content-dimmed hover:border-brand-1/60 hover:text-brand-1 transition min-w-[120px] h-full"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-dimmed">
                <IconPlus size={16} />
              </span>
              <span className="text-xs font-medium mt-1">Add status</span>
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
