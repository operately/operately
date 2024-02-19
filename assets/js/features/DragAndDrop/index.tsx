export { useDragAndDropContext, DragAndDropProvider } from "./context";
export { useDraggable } from "./draggable";

import * as React from "react";
import { useDragAndDropContext } from "./context";

export function useDropZone({ id }: { id: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const { isDragging, draggedId, onDrop, draggedElementSize } = useDragAndDropContext();
  const [isOver, setIsOver] = React.useState(false);

  const draggedIdRef = React.useRef(draggedId);
  React.useEffect(() => {
    draggedIdRef.current = draggedId;
  }, [draggedId]);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const onMouseEnter = () => {
      if (!isDragging) return;
      setIsOver(true);
    };

    const onMouseLeave = () => {
      setIsOver(false);
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      onDrop(id, draggedIdRef.current, 0);
    };

    element.addEventListener("mouseenter", onMouseEnter);
    element.addEventListener("mouseleave", onMouseLeave);
    element.addEventListener("mouseup", onMouseUp);

    return () => {
      element.removeEventListener("mouseenter", onMouseEnter);
      element.removeEventListener("mouseleave", onMouseLeave);
      element.removeEventListener("mouseup", onMouseUp);
    };
  }, [ref, isDragging, draggedId, isOver, onDrop]);

  return {
    ref,
    isOver,
    draggedElementSize,
  };
}
