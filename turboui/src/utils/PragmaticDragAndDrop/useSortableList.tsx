import { useEffect, useState } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { DraggableItem, OnReorderFunction } from "./types";

/**
 * Hook to manage a sortable list with Pragmatic drag and drop.
 *
 * This hook sets up monitoring for drag and drop events and handles reordering logic.
 * It should be used at the list container level.
 *
 * @param items - Array of items with id and index
 * @param onReorder - Callback when an item is reordered with new index
 * @returns State for tracking drag operations
 *
 * @example
 * const { draggedItemId } = useSortableList(items, (itemId, newIndex) => {
 *   // Handle reorder
 * });
 */
export function useSortableList<T extends DraggableItem>(items: T[], onReorder: OnReorderFunction) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Set up the monitor on mount
  useEffect(() => {
    return monitorForElements({
      onDragStart: ({ source }) => {
        const itemId = source.data.itemId as string;
        setDraggedItemId(itemId);
      },
      onDrop: ({ source, location }) => {
        setDraggedItemId(null);

        const target = location.current.dropTargets[0];
        if (!target) return;

        const sourceId = source.data.itemId as string;
        const targetId = target.data.itemId as string;

        if (sourceId === targetId) return;

        const sourceIndex = items.findIndex((item) => item.id === sourceId);
        const targetIndex = items.findIndex((item) => item.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        const closestEdge = extractClosestEdge(target.data);

        // Calculate the new index based on the drop edge
        let newIndex: number;
        if (closestEdge === "top") {
          newIndex = targetIndex;
        } else {
          newIndex = targetIndex + 1;
        }

        // Adjust for items moving down in the list
        if (sourceIndex < newIndex) {
          newIndex = newIndex - 1;
        }

        onReorder(sourceId, newIndex);
      },
    });
  }, [items, onReorder]);

  return {
    draggedItemId,
  };
}
