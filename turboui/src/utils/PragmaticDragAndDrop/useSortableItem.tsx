import { useEffect, useRef, useState } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";

interface UseSortableItemProps {
  itemId: string;
  index: number;
  disabled?: boolean;
}

interface UseSortableItemReturn {
  ref: React.RefObject<HTMLElement>;
  dragHandleRef: React.RefObject<HTMLElement>;
  isDragging: boolean;
  closestEdge: Edge | null;
}

/**
 * Hook to make an individual item sortable with Pragmatic drag and drop.
 *
 * This hook makes an element draggable and a drop target for reordering.
 * Use this on each item in a sortable list.
 *
 * @param itemId - Unique identifier for the item
 * @param index - Current index of the item in the list
 * @param disabled - Whether drag and drop is disabled
 * @returns Refs and state for the sortable item
 *
 * @example
 * const { ref, dragHandleRef, isDragging } = useSortableItem({
 *   itemId: item.id,
 *   index: item.index
 * });
 *
 * return (
 *   <div ref={ref}>
 *     <div ref={dragHandleRef}>Drag Handle</div>
 *     <div>Item content</div>
 *   </div>
 * );
 */
export function useSortableItem({ itemId, index, disabled = false }: UseSortableItemProps): UseSortableItemReturn {
  const ref = useRef<HTMLElement>(null);
  const dragHandleRef = useRef<HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const element = ref.current;
    const dragHandle = dragHandleRef.current;

    if (!element || disabled) return;

    return combine(
      draggable({
        element,
        dragHandle: dragHandle || undefined,
        getInitialData: () => ({ itemId, index }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        getData: ({ input }) => {
          return attachClosestEdge(
            { itemId, index },
            {
              element,
              input,
              allowedEdges: ["top", "bottom"],
            },
          );
        },
        onDragEnter: (args) => {
          const edge = extractClosestEdge(args.self.data);
          setClosestEdge(edge);
        },
        onDrag: (args) => {
          const edge = extractClosestEdge(args.self.data);
          setClosestEdge(edge);
        },
        onDragLeave: () => {
          setClosestEdge(null);
        },
        onDrop: () => {
          setClosestEdge(null);
        },
      }),
    );
  }, [itemId, index, disabled]);

  return {
    ref,
    dragHandleRef,
    isDragging,
    closestEdge,
  };
}
