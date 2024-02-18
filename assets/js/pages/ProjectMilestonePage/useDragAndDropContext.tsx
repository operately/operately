import * as React from "react";

const DRAG_DISTANCE_INERTIA = 5; // pixels

interface DragAndDropContextValue {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
}

const DragAndDropContext = React.createContext<DragAndDropContextValue>({
  isDragging: false,
  setIsDragging: () => {
    throw new Error("setIsDragging must be used within a DragAndDropProvider");
  },
});

export function useDragAndDropContext() {
  const context = React.useContext(DragAndDropContext);

  if (!context) {
    throw new Error("useDragAndDropContext must be used within a DragAndDropProvider");
  }

  return context;
}

export function DragAndDropProvider({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = React.useState(false);

  const value = {
    isDragging,
    setIsDragging,
  };

  return <DragAndDropContext.Provider value={value}>{children}</DragAndDropContext.Provider>;
}

export function useDraggable({ id }: { id: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const context = useDragAndDropContext();

  const isMouseDown = React.useRef(false);
  const isDragging = React.useRef(false);
  const mouseDownPosition = React.useRef({ x: 0, y: 0 });

  const elementRect = React.useRef({ width: 0, height: 0, top: 0, left: 0 });

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    elementRect.current = { width: rect.width, height: rect.height, top: rect.top, left: rect.left };

    const mouseDown = (e: MouseEvent) => {
      isMouseDown.current = true;
      mouseDownPosition.current = { x: e.clientX, y: e.clientY };
    };

    const mouseUp = () => {
      isMouseDown.current = false;
      if (!isDragging.current) return;

      stopDrag();
      ref.current?.removeAttribute("style");
    };

    const mouseMove = (e: MouseEvent) => {
      if (!isMouseDown.current) return;

      if (isDragging.current) {
        followCursor(e);
      } else {
        initializeDragIfConditionsMet(e);
      }
    };

    const followCursor = (e: MouseEvent) => {
      const left = e.clientX - mouseDownPosition.current.x + elementRect.current.width / 2 + elementRect.current.left;
      const top = e.clientY - mouseDownPosition.current.y + elementRect.current.height / 2 + elementRect.current.top;

      Object.assign(element.style, {
        position: "fixed",
        left: left + "px",
        top: top + "px",
        zIndex: "10000",
        pointerEvents: "none",
        userSelect: "none",
        transform: "translate(-50%, -50%)",
        width: elementRect.current.width + "px",
        height: elementRect.current.height + "px",
      });
    };

    const initializeDragIfConditionsMet = (e: MouseEvent) => {
      const dx = Math.abs(mouseDownPosition.current.x - e.clientX);
      const dy = Math.abs(mouseDownPosition.current.y - e.clientY);

      if (dx > DRAG_DISTANCE_INERTIA || dy > DRAG_DISTANCE_INERTIA) {
        startDrag();
      }
    };

    function startDrag() {
      isDragging.current = true;
      context.setIsDragging(true);
    }

    function stopDrag() {
      isDragging.current = false;
      context.setIsDragging(false);
    }

    element.addEventListener("dragstart", (e) => e.preventDefault());

    element.addEventListener("mousedown", mouseDown);
    document.addEventListener("mouseup", mouseUp);
    document.addEventListener("mousemove", mouseMove);

    return () => {
      element.removeEventListener("mousedown", mouseDown);
      document.removeEventListener("mouseup", mouseUp);
      document.removeEventListener("mousemove", mouseMove);
    };
  }, [ref, isDragging, isMouseDown]);

  return {
    ref,
  };
}

export function useDropZone({ id: id }) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const { isDragging } = useDragAndDropContext();
  const [isOver, setIsOver] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const mouseEnter = () => {
      if (!isDragging) return;

      setIsOver(true);
    };

    const mouseLeave = () => {
      setIsOver(false);
    };

    element.addEventListener("mouseenter", mouseEnter);
    element.addEventListener("mouseleave", mouseLeave);

    return () => {
      element.removeEventListener("mouseenter", mouseEnter);
      element.removeEventListener("mouseleave", mouseLeave);
    };
  }, [ref, isOver, isDragging]);

  return {
    ref,
    isOver,
  };
}
