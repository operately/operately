import * as React from "react";

const DRAG_DISTANCE_INERTIA = 5; // pixels

interface DragAndDropContextValue {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
}

const DragAndDropContext = React.createContext<DragAndDropContextValue>({
  isDragging: false,
  setIsDragging: () => {},
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

  const isMouseDown = React.useRef(false);
  const isDragging = React.useRef(false);
  const mouseDownPosition = React.useRef({ x: 0, y: 0 });

  const elementSize = React.useRef({ width: 0, height: 0 });

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    elementSize.current = { width: rect.width, height: rect.height };

    const mouseDown = (e: MouseEvent) => {
      isMouseDown.current = true;
      mouseDownPosition.current = { x: e.clientX, y: e.clientY };
    };

    const mouseUp = () => {
      isMouseDown.current = false;
      if (!isDragging.current) return;

      isDragging.current = false;
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
      const left = e.clientX + elementSize.current.width / 2;
      const top = e.clientY + elementSize.current.height / 2;

      Object.assign(element.style, {
        position: "fixed",
        left: left + "px",
        top: top + "px",
        zIndex: "10000",
        pointerEvents: "none",
        userSelect: "none",
        transform: "translate(-50%, -50%)",
        width: elementSize.current.width + "px",
        height: elementSize.current.height + "px",
      });
    };

    const initializeDragIfConditionsMet = (e: MouseEvent) => {
      const dx = Math.abs(mouseDownPosition.current.x - e.clientX);
      const dy = Math.abs(mouseDownPosition.current.y - e.clientY);

      if (dx > DRAG_DISTANCE_INERTIA || dy > DRAG_DISTANCE_INERTIA) {
        isDragging.current = true;
      }
    };

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
