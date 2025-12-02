import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

import {
  DragHandle,
  DropIndicator,
  DropPlaceholder,
  projectItemsWithPlaceholder,
  useBoardDnD,
  useSortableItem,
} from "../";
import classNames from "../../classnames";
import type { BoardLocation, OnBoardMove } from "../types";

interface ExampleTask {
  id: string;
  title: string;
}

type ColumnState = Record<string, string[]>;

const tasks: Record<string, ExampleTask> = {
  "task-1": { id: "task-1", title: "Draft brief" },
  "task-2": { id: "task-2", title: "Align stakeholders" },
  "task-3": { id: "task-3", title: "Create mockups" },
  "task-4": { id: "task-4", title: "Ship release" },
  "task-5": { id: "task-5", title: "Retrospective" },
};

const initialColumns: ColumnState = {
  "milestone-a:todo": ["task-1", "task-2"],
  "milestone-a:in_progress": ["task-3"],
  "milestone-b:todo": ["task-4"],
  "milestone-b:done": ["task-5"],
};

const columnsMeta = [
  { id: "milestone-a:todo", title: "Milestone A • Todo" },
  { id: "milestone-a:in_progress", title: "Milestone A • In progress" },
  { id: "milestone-b:todo", title: "Milestone B • Todo" },
  { id: "milestone-b:done", title: "Milestone B • Done" },
];

function useBoardState() {
  const [columns, setColumns] = useState<ColumnState>(initialColumns);

  const handleMove = useCallback<OnBoardMove>((move) => {
    action("board-move")(move);

    setColumns((previous) => {
      const next: ColumnState = { ...previous };

      const sourceList = [...(next[move.source.containerId] || [])];
      const destinationList =
        move.source.containerId === move.destination.containerId
          ? sourceList
          : [...(next[move.destination.containerId] || [])];

      const currentIndex = sourceList.indexOf(move.itemId);
      if (currentIndex !== -1) {
        sourceList.splice(currentIndex, 1);
      }

      next[move.source.containerId] = sourceList;

      const boundedIndex = Math.max(0, Math.min(move.destination.index, destinationList.length));
      destinationList.splice(boundedIndex, 0, move.itemId);
      next[move.destination.containerId] = destinationList;

      return next;
    });
  }, []);

  return { columns, handleMove };
}

function LineIndicatorBoard() {
  const { columns, handleMove } = useBoardState();
  const { draggedItemId } = useBoardDnD(handleMove);

  return (
    <div className="p-6 space-y-4">
      <div className="text-lg font-semibold">Line indicator (DropIndicator)</div>
      <div className="flex gap-4 flex-wrap">
        {columnsMeta.map((column) => (
          <LineIndicatorColumn
            key={column.id}
            title={column.title}
            containerId={column.id}
            itemIds={columns[column.id] || []}
            draggedItemId={draggedItemId}
          />
        ))}
      </div>
    </div>
  );
}

function PlaceholderBoard() {
  const { columns, handleMove } = useBoardState();
  const { draggedItemId, destination, draggedItemDimensions } = useBoardDnD(handleMove);

  return (
    <div className="p-6 space-y-4">
      <div className="text-lg font-semibold">Trello-style placeholder</div>
      <div className="text-sm text-content-dimmed">
        The dragged card is removed from its list and a placeholder with the same size reserves its future position.
      </div>
      <div className="flex gap-4 flex-wrap">
        {columnsMeta.map((column) => (
          <PlaceholderColumn
            key={column.id}
            title={column.title}
            containerId={column.id}
            itemIds={columns[column.id] || []}
            draggedItemId={draggedItemId}
            targetLocation={destination}
            placeholderHeight={draggedItemDimensions?.height ?? null}
          />
        ))}
      </div>
    </div>
  );
}

interface LineIndicatorColumnProps {
  title: string;
  containerId: string;
  itemIds: string[];
  draggedItemId: string | null;
}

function LineIndicatorColumn({ title, containerId, itemIds, draggedItemId }: LineIndicatorColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({
        containerId,
        index: itemIds.length,
      }),
    });
  }, [containerId, itemIds.length]);

  return (
    <div
      ref={columnRef}
      className="flex-1 min-w-[240px] rounded-lg border border-surface-outline bg-surface-raised p-4 shadow-sm space-y-3"
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="space-y-3 min-h-[160px]">
        {itemIds.map((taskId, index) => (
          <LineIndicatorCard
            key={taskId}
            task={tasks[taskId]!}
            containerId={containerId}
            index={index}
            isDraggingGlobal={draggedItemId === taskId}
          />
        ))}

        {itemIds.length === 0 && (
          <div className="text-xs text-content-dimmed border border-dashed border-surface-outline rounded-md p-4 text-center bg-surface">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

interface LineIndicatorCardProps {
  task: ExampleTask;
  containerId: string;
  index: number;
  isDraggingGlobal: boolean;
}

function LineIndicatorCard({ task, containerId, index, isDraggingGlobal }: LineIndicatorCardProps) {
  const { ref, dragHandleRef, isDragging, closestEdge } = useSortableItem({
    itemId: task.id,
    index,
    containerId,
  });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={classNames("rounded-md border border-surface-outline bg-surface p-3 shadow-sm relative group", {
        "opacity-60": isDraggingGlobal,
      })}
    >
      {closestEdge && <DropIndicator edge={closestEdge} />}
      <div className="flex items-center gap-2">
        <div ref={dragHandleRef as React.RefObject<HTMLDivElement>}>
          <DragHandle isDragging={isDragging} />
        </div>
        <div className="font-medium text-sm">{task.title}</div>
      </div>
    </div>
  );
}

interface PlaceholderColumnProps {
  title: string;
  containerId: string;
  itemIds: string[];
  draggedItemId: string | null;
  targetLocation: BoardLocation | null;
  placeholderHeight: number | null;
}

function PlaceholderColumn({
  title,
  containerId,
  itemIds,
  draggedItemId,
  targetLocation,
  placeholderHeight,
}: PlaceholderColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const { items: visibleItemIds, placeholderIndex } = projectItemsWithPlaceholder({
    items: itemIds,
    getId: (id) => id,
    draggedItemId,
    targetLocation,
    containerId,
  });

  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({
        containerId,
        index: visibleItemIds.length,
      }),
    });
  }, [containerId, visibleItemIds.length]);

  return (
    <div
      ref={columnRef}
      className="flex-1 min-w-[240px] rounded-lg border border-surface-outline bg-surface-raised p-4 shadow-sm space-y-3"
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="space-y-3 min-h-[160px]">
        {visibleItemIds.map((taskId, index) => (
          <React.Fragment key={taskId}>
            {placeholderIndex === index && (
              <DropPlaceholder containerId={containerId} index={index} height={placeholderHeight} />
            )}
            <PlaceholderCard task={tasks[taskId]!} containerId={containerId} index={index} />
          </React.Fragment>
        ))}

        {placeholderIndex !== null && placeholderIndex === visibleItemIds.length && (
          <DropPlaceholder containerId={containerId} index={visibleItemIds.length} height={placeholderHeight} />
        )}

        {visibleItemIds.length === 0 && placeholderIndex === null && (
          <div className="text-xs text-content-dimmed border border-dashed border-surface-outline rounded-md p-4 text-center bg-surface">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

interface PlaceholderCardProps {
  task: ExampleTask;
  containerId: string;
  index: number;
}

function PlaceholderCard({ task, containerId, index }: PlaceholderCardProps) {
  const { ref, dragHandleRef, isDragging } = useSortableItem({
    itemId: task.id,
    index,
    containerId,
  });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={classNames(
        "rounded-md border border-surface-outline bg-surface p-3 shadow-sm relative group transition-none",
        {
          "bg-accent/5 border-accent": isDragging,
        },
      )}
    >
      <div className="flex items-center gap-2">
        <div ref={dragHandleRef as React.RefObject<HTMLDivElement>}>
          <DragHandle isDragging={isDragging} />
        </div>
        <div className="font-medium text-sm">{task.title}</div>
      </div>
    </div>
  );
}

const meta = {
  title: "Utils/PragmaticDragAndDrop/DropFeedback",
  component: LineIndicatorBoard,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LineIndicatorBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDropIndicator: Story = {
  render: () => <LineIndicatorBoard />,
};

export const WithDropPlaceholder: Story = {
  render: () => <PlaceholderBoard />,
};
