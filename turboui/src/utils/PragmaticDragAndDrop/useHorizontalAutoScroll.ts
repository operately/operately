/**
 * useHorizontalAutoScroll
 *
 * Hook that auto-scrolls a horizontal container when a Pragmatic DnD drag nears its left/right edges.
 * - Returns a ref; attach it to the overflow-x container that holds the Kanban columns.
 * - Listens to Pragmatic DnD monitor events to detect edge proximity while dragging our Kanban items.
 * - Scroll speed ramps with proximity to the edge and stops when the drag ends or bounds are reached.
 */
import { useEffect, useRef } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

const EDGE_DISTANCE_PX = 80;
const MIN_SPEED_PX = 6;
const MAX_SPEED_PX = 20;

export function useHorizontalAutoScroll() {
  // Attach this ref to the horizontal overflow container you want to auto-scroll while dragging
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) return;

    let animationFrame: number | null = null;
    let direction: "left" | "right" | null = null;
    let intensity = 0;

    const stopScrolling = () => {
      direction = null;
      intensity = 0;
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const step = () => {
      if (!direction) return;

      const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
      if (maxScrollLeft <= 0) {
        stopScrolling();
        return;
      }

      const speed = MIN_SPEED_PX + (MAX_SPEED_PX - MIN_SPEED_PX) * intensity;
      const delta = direction === "left" ? -speed : speed;
      const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, scrollElement.scrollLeft + delta));

      scrollElement.scrollLeft = nextScrollLeft;

      const reachedEdge = (direction === "left" && nextScrollLeft === 0) || (direction === "right" && nextScrollLeft === maxScrollLeft);
      if (reachedEdge) {
        stopScrolling();
        return;
      }

      animationFrame = requestAnimationFrame(step);
    };

    const startScrolling = (nextDirection: "left" | "right", nextIntensity: number) => {
      direction = nextDirection;
      intensity = Math.min(1, Math.max(0, nextIntensity));

      if (animationFrame === null) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    const cleanup = monitorForElements({
      canMonitor: ({ source }) => typeof source.data.containerId === "string" && typeof source.data.itemId === "string",
      onDrag: ({ location }) => {
        const input = location.current.input;
        if (!input) {
          stopScrolling();
          return;
        }
        const { clientX, clientY } = input;
        const rect = scrollElement.getBoundingClientRect();
        const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
        const hasOverflow = maxScrollLeft > 0;

        if (!hasOverflow) {
          stopScrolling();
          return;
        }

        const isPointerWithinContainer =
          clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
        const isDraggingOverColumns = location.current.dropTargets.some((target) => scrollElement.contains(target.element));

        if (!isPointerWithinContainer && !isDraggingOverColumns) {
          stopScrolling();
          return;
        }

        const leftEdge = rect.left + EDGE_DISTANCE_PX;
        const rightEdge = rect.right - EDGE_DISTANCE_PX;

        if (clientX < leftEdge && scrollElement.scrollLeft > 0) {
          const distanceIntoEdge = leftEdge - clientX;
          startScrolling("left", distanceIntoEdge / EDGE_DISTANCE_PX);
          return;
        }

        if (clientX > rightEdge && scrollElement.scrollLeft < maxScrollLeft) {
          const distanceIntoEdge = clientX - rightEdge;
          startScrolling("right", distanceIntoEdge / EDGE_DISTANCE_PX);
          return;
        }

        stopScrolling();
      },
      onDrop: stopScrolling,
    });

    return () => {
      stopScrolling();
      cleanup();
    };
  }, []);

  return scrollContainerRef;
}
