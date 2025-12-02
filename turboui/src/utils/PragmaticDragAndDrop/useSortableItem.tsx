import { useEffect, useRef, useState } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";

interface UseSortableItemProps {
  itemId: string;
  index: number;
  containerId?: string;
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
export function useSortableItem({
  itemId,
  index,
  containerId,
  disabled = false,
}: UseSortableItemProps): UseSortableItemReturn {
  const ref = useRef<HTMLElement>(null);
  const dragHandleRef = useRef<HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const closestEdgeRef = useRef<Edge | null>(null);
  const edgeUpdateTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    const dragHandle = dragHandleRef.current;

    if (!element || disabled) return;

    const updateEdgeWithDelay = (edge: Edge | null) => {
      // Clear any pending update
      if (edgeUpdateTimeoutRef.current) {
        clearTimeout(edgeUpdateTimeoutRef.current);
      }

      // Only update if different from current
      if (edge !== closestEdgeRef.current) {
        // Add a small delay to prevent rapid flickering
        edgeUpdateTimeoutRef.current = window.setTimeout(() => {
          closestEdgeRef.current = edge;
          setClosestEdge(edge);
        }, 100);
      }
    };

    return combine(
      draggable({
        element,
        dragHandle: dragHandle || undefined,
        getInitialData: () => ({ itemId, index, containerId }),
        onGenerateDragPreview: ({ nativeSetDragImage, location, source }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element: source.element,
              input: location.current.input,
            }),
            render: ({ container }) => {
              const clone = element.cloneNode(true) as HTMLElement;

              // Apply tilt and any other styles
              clone.style.transform = "rotate(5deg)";
              clone.style.width = `${element.offsetWidth}px`;
              clone.style.height = `${element.offsetHeight}px`;

              container.appendChild(clone);

              // Return cleanup function
              return () => container.removeChild(clone);
            },
          });
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        getData: ({ input }) => {
          return attachClosestEdge(
            { itemId, index, containerId },
            {
              element,
              input,
              allowedEdges: ["top", "bottom"],
            },
          );
        },
        onDragEnter: (args) => {
          const edge = extractClosestEdge(args.self.data);
          closestEdgeRef.current = edge;
          setClosestEdge(edge);
        },
        onDrag: (args) => {
          const edge = extractClosestEdge(args.self.data);
          updateEdgeWithDelay(edge);
        },
        onDragLeave: () => {
          if (edgeUpdateTimeoutRef.current) {
            clearTimeout(edgeUpdateTimeoutRef.current);
          }
          closestEdgeRef.current = null;
          setClosestEdge(null);
        },
        onDrop: () => {
          if (edgeUpdateTimeoutRef.current) {
            clearTimeout(edgeUpdateTimeoutRef.current);
          }
          closestEdgeRef.current = null;
          setClosestEdge(null);
        },
      }),
    );
  }, [itemId, index, containerId, disabled]);

  return {
    ref,
    dragHandleRef,
    isDragging,
    closestEdge,
  };
}
