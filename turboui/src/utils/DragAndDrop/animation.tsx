import React from "react";
import { useDragAndDropContext } from "./context";
import { useDropZone } from "./dropzone";

/**
 * Provides animation styles for drag-and-drop operations within a drop zone.
 *
 * This hook calculates styles to animate both the drop zone container and individual items
 * during drag-and-drop interactions. It should be used in conjunction with `useDropZone`.
 *
 * @param zoneId - Identifier for the drop zone (must match the ID used in `useDropZone`)
 * @param items - Array of items in the drop zone (used to calculate positions)
 *
 * @returns an object containing:
 * - containerStyle: Style object to apply to the drop zone container element (the same element
 *   that receives the `ref` from `useDropZone`)
 * - itemStyle: Function that takes an item ID and returns style properties for that item
 *
 * @example
 * // Basic usage with a drop zone
 * const { ref } = useDropZone({ id: "targets" });
 * const { containerStyle, itemStyle } = useDraggingAnimation("targets", items);
 *
 * return (
 *   <div ref={ref} style={containerStyle}>
 *     {items.map(item => (
 *       <div key={item.id} style={itemStyle(item.id)}>
 *         {item.content}
 *       </div>
 *     ))}
 *   </div>
 * );
 */

export function useDraggingAnimation<T extends { id?: string | null }>(zoneId: string, items: T[]) {
  const [animate, setAnimate] = React.useState(false);
  const { draggedId } = useDragAndDropContext();
  const { isOver, isSourceZone, dropIndex, draggedElementHeight } = useDropZone({ id: zoneId });

  React.useLayoutEffect(() => {
    if (draggedId !== null) {
      setTimeout(() => setAnimate(true), 100);
    } else {
      setAnimate(false);
    }
  }, [draggedId]);

  const visibleIndexes = React.useMemo(() => {
    let res = {};

    if (!isOver) {
      items.forEach((t, i) => (res[t.id!] = i));
    } else {
      items.filter((t) => t.id !== draggedId).forEach((t, i) => (res[t.id!] = i));
    }

    return res;
  }, [isOver, draggedId, items.length]);

  const itemStyle = (itemId: string) => {
    if (!isOver) return {};
    const index = visibleIndexes[itemId];

    return {
      transform: `translateY(${index < dropIndex! ? 0 : draggedElementHeight!}px)`,
      transition: animate ? "transform 0.1s ease-in-out" : "",
    };
  };

  const containerStyle = {
    paddingBottom: isOver && !isSourceZone ? draggedElementHeight! : 0,
    transition: animate && !isSourceZone ? "padding 0.1s ease-in-out" : "",
  };

  return { animate, containerStyle, itemStyle };
}
