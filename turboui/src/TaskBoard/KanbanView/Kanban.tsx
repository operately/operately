import React, { useMemo } from "react";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";

import { IconChevronDown, IconChevronRight, IconPlus } from "../../icons";
import { createTestId } from "../../TestableElement";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";
import { Column } from "./Column";
import type { KanbanStatus } from "./types";
import { StatusSelector } from "../../StatusSelector";
import { useHorizontalAutoScroll, useSortableItem, DropIndicator } from "../../utils/PragmaticDragAndDrop";
import type { BoardLocation } from "../../utils/PragmaticDragAndDrop";
import classNames from "../../utils/classnames";
import { useTaskKeyboardNavigation } from "../hooks/useTaskKeyboardNavigation";

interface Props {
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
  onAddStatusClick?: () => void;
  onEditStatus?: (status: StatusSelector.StatusOption) => void;
  onDeleteStatus?: (status: StatusSelector.StatusOption) => void;
  onTaskClick: (taskId: string) => void;
  isTaskSlideInOpen: boolean;
  canEdit: boolean;
  canManageStatuses?: boolean;
}

export function Kanban({
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
  onAddStatusClick,
  onEditStatus,
  onDeleteStatus,
  onTaskClick,
  isTaskSlideInOpen,
  canEdit,
  canManageStatuses = false,
}: Props) {
  const testId = useMemo(
    () => (milestone ? createTestId("milestone", milestone.id) : "kanban-no-milestone"),
    [milestone],
  );
  const scrollContainerRef = useHorizontalAutoScroll();
  const {
    containerRef: keyboardContainerRef,
    selectedTaskId: keyboardSelectedTaskId,
    scopeBind,
  } = useTaskKeyboardNavigation<HTMLDivElement>({
    fieldShortcuts: { status: false, create: Boolean(canEdit && onTaskCreate) },
    clearSelectionWithEscape: !isTaskSlideInOpen,
  });

  const unknownStatus = statuses.find((status) => status.value === "unknown-status");
  const regularStatuses = statuses.filter((status) => status.value !== "unknown-status");
  const activeStatuses = regularStatuses.filter((status) => !status.closed);
  const closedStatuses = regularStatuses.filter((status) => status.closed);
  const hasClosedTasks = closedStatuses.some((status) => (columns[status.value] || []).length > 0);
  const [areClosedStatusesVisible, setAreClosedStatusesVisible] = React.useState(hasClosedTasks);

  React.useEffect(() => {
    if (hasClosedTasks) setAreClosedStatusesVisible(true);
  }, [hasClosedTasks]);

  const visibleStatuses = areClosedStatusesVisible ? regularStatuses : activeStatuses;

  const setScrollContainerRefs = React.useCallback(
    (element: HTMLDivElement | null) => {
      (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = element;
      (keyboardContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = element;
    },
    [keyboardContainerRef, scrollContainerRef],
  );

  const handleTaskCreate = (title: string, statusValue: string) => {
    if (!onTaskCreate) return;

    const status = statuses.find((s) => s.value === statusValue);

    onTaskCreate({
      title,
      milestone,
      dueDate: null,
      assignees: [],
      status: status,
    });
  };

  return (
    <section className="bg-surface-base min-h-[80vh]" data-test-id={testId}>
      <div ref={setScrollContainerRefs} className="h-[80vh] overflow-x-auto px-3 py-3" {...scopeBind}>
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
              canCreateTask={canEdit}
              selectedTaskId={keyboardSelectedTaskId}
              hideStatusIcon
              disableDnD
            />
          )}

          {visibleStatuses.map((status, index) => (
            <SortableStatusColumn key={status.value} status={status} index={index} canReorder={canManageStatuses}>
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
                  isStatusDraggable={canManageStatuses}
                  allStatuses={statuses}
                  canManageStatuses={canManageStatuses}
                  canCreateTask={canEdit}
                  onEditStatus={onEditStatus}
                  onDeleteStatus={onDeleteStatus}
                  onTaskClick={onTaskClick}
                  selectedTaskId={keyboardSelectedTaskId}
                />
              )}
            </SortableStatusColumn>
          ))}

          {closedStatuses.length > 0 && (
            <button
              type="button"
              className="mt-1 flex shrink-0 items-center gap-1.5 rounded px-2 py-2 text-sm font-medium text-content-dimmed transition-colors hover:bg-surface-dimmed hover:text-content-base"
              onClick={() => setAreClosedStatusesVisible((isVisible) => !isVisible)}
              aria-expanded={areClosedStatusesVisible}
              data-test-id="toggle-closed-statuses"
            >
              {areClosedStatusesVisible ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
              <span>Closed</span>
              <span className="text-xs tabular-nums">{closedStatuses.length}</span>
            </button>
          )}

          {canManageStatuses && onAddStatusClick && (
            <button
              type="button"
              className="mt-1 flex shrink-0 items-center gap-1.5 rounded px-2 py-2 text-sm font-medium text-content-dimmed transition-colors hover:bg-surface-dimmed hover:text-content-base"
              onClick={onAddStatusClick}
              data-test-id="add-status"
            >
              <IconPlus size={16} />
              Add status
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
