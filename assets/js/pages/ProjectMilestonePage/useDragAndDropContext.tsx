import * as React from "react";

const DRAG_DISTANCE_INERTIA = 5; // pixels

type OnDropFunction = (dropZoneId: string, draggedId: string, indexInDropZone: number) => void;

interface DragAndDropContextValue {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;

  draggedId: string;
  setDraggedId: (id: string) => void;

  draggedElementSize: { width: number; height: number };
  setDraggedElementSize: (size: { width: number; height: number }) => void;

  onDrop: OnDropFunction;
}

const DragAndDropContext = React.createContext<DragAndDropContextValue | null>(null);

export function useDragAndDropContext(): DragAndDropContextValue {
  const context = React.useContext(DragAndDropContext);
  if (!context) throw new Error("useDragAndDropContext must be used within a DragAndDropProvider");

  return context;
}

export function DragAndDropProvider({ children, onDrop }: { children: React.ReactNode; onDrop: OnDropFunction }) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedId, setDraggedId] = React.useState("");
  const [draggedElementSize, setDraggedElementSize] = React.useState({ width: 0, height: 0 });

  const value = {
    isDragging,
    draggedId,
    draggedElementSize,

    setIsDragging,
    setDraggedId: (id: string) => {
      console.log("setDraggedId", id);
      setDraggedId(id);
    },
    setDraggedElementSize,

    onDrop,
  };

  return <DragAndDropContext.Provider value={value}>{children}</DragAndDropContext.Provider>;
}

class DraggableMouseEvents {
  private id: string;
  private el: HTMLElement;

  private isDragging = false;
  private isMouseDown = false;
  private mouseDownPosition: { x: number; y: number } | null = null;
  private elementRect: DOMRect | null = null;

  private context: DragAndDropContextValue;

  private mouseDown: (e: MouseEvent) => void;
  private mouseUp: () => void;
  private mouseMove: (e: MouseEvent) => void;
  private dragStart: (e: DragEvent) => void;

  constructor(id: string, el: HTMLElement, context: DragAndDropContextValue) {
    this.context = context;

    this.id = id;
    this.el = el;
    this.mouseDownPosition = null;

    this.mouseDown = this.onMouseDown.bind(this);
    this.mouseUp = this.onMouseUp.bind(this);
    this.mouseMove = this.onMouseMove.bind(this);
    this.dragStart = this.onDragStart.bind(this);
  }

  bindEvents() {
    this.el.addEventListener("dragstart", this.dragStart);
    this.el.addEventListener("mousedown", this.mouseDown);
    document.addEventListener("mouseup", this.mouseUp);
    document.addEventListener("mousemove", this.mouseMove);
  }

  unbindEvents() {
    this.el.removeEventListener("mousedown", this.mouseDown);
    document.removeEventListener("mouseup", this.mouseUp);
    document.removeEventListener("mousemove", this.mouseMove);
  }

  onDragStart(e: DragEvent) {
    e.preventDefault();
  }

  onMouseDown(e: MouseEvent) {
    this.isMouseDown = true;
    this.mouseDownPosition = { x: e.clientX, y: e.clientY };
  }

  onMouseUp() {
    this.isMouseDown = false;
    this.stopDragging();
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isMouseDown) return;

    if (this.isDragging) {
      this.followMouse(e);
    } else {
      const dx = Math.abs(this.mouseDownPosition!.x - e.clientX);
      const dy = Math.abs(this.mouseDownPosition!.y - e.clientY);

      if (dx > DRAG_DISTANCE_INERTIA || dy > DRAG_DISTANCE_INERTIA) {
        this.startDragging();
      }
    }
  }

  startDragging() {
    if (this.isDragging) return;

    this.isDragging = true;
    this.elementRect = this.el.getBoundingClientRect();

    this.context.setIsDragging(this.isDragging);
    this.context.setDraggedId(this.id);
  }

  stopDragging() {
    if (!this.isDragging) return;

    this.resetElementStyle();

    this.isDragging = false;
    this.context.setIsDragging(this.isDragging);
    this.context.setDraggedId("");
  }

  followMouse(e: MouseEvent) {
    const left = e.clientX - this.mouseDownPosition!.x + this.elementRect!.width / 2 + this.elementRect!.left;
    const top = e.clientY - this.mouseDownPosition!.y + this.elementRect!.height / 2 + this.elementRect!.top;

    Object.assign(this.el.style, {
      position: "fixed",
      left: left + "px",
      top: top + "px",
      zIndex: "10000",
      pointerEvents: "none",
      userSelect: "none",
      transform: "translate(-50%, -50%)",
      width: this.el.getBoundingClientRect().width + "px",
      height: this.el.getBoundingClientRect().height + "px",
    });
  }

  resetElementStyle() {
    this.el.removeAttribute("style");
  }
}

export function useDraggable({ id }: { id: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const context = useDragAndDropContext();

  React.useLayoutEffect(() => {
    const handler = new DraggableMouseEvents(id, ref.current!, context);
    handler.bindEvents();
    return () => handler.unbindEvents();
  }, [ref]);

  return { ref };
}

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

// const [isDragging, setIsDragging] = React.useState(false);
// const [isMouseDown, setIsMouseDown] = React.useState(false);
// const [elementRect, setElementRect] = React.useState({ width: 0, height: 0, top: 0, left: 0 });
// const [mouseDownPosition, setMouseDownPosition] = React.useState({ x: 0, y: 0 });
// const element = ref.current;
// if (!element) return;

// element.setAttribute("draggable", "true");
// element.setAttribute("draggableId", id);

// const mouseDown = (e: MouseEvent) => {
//   setIsMouseDown(true);
//   setMouseDownPosition({ x: e.clientX, y: e.clientY });
// };

// const mouseUp = () => {
//   if (isDragging) {
//     context.setDraggedId("");
//     context.setIsDragging(false);

//     ref.current?.removeAttribute("style");
//     setIsDragging(false);
//   }
//   setIsMouseDown(false);
// };

// const mouseMove = (e: MouseEvent) => {
//   if (!isMouseDown) return;

//   if (isDragging) {
//     const left = e.clientX - mouseDownPosition.x + elementRect.width / 2 + elementRect.left;
//     const top = e.clientY - mouseDownPosition.y + elementRect.height / 2 + elementRect.top;

//     Object.assign(element.style, {
//       position: "fixed",
//       left: left + "px",
//       top: top + "px",
//       zIndex: "10000",
//       pointerEvents: "none",
//       userSelect: "none",
//       transform: "translate(-50%, -50%)",
//       width: elementRect.width + "px",
//       height: elementRect.height + "px",
//     });
//   } else {
//     const dx = Math.abs(mouseDownPosition.x - e.clientX);
//     const dy = Math.abs(mouseDownPosition.y - e.clientY);

//     if (dx > DRAG_DISTANCE_INERTIA || dy > DRAG_DISTANCE_INERTIA) {
//       const rect = ref.current!.getBoundingClientRect();

//       setIsDragging(true);
//       setElementRect({ width: rect.width, height: rect.height, top: rect.top, left: rect.left });

//       context.setIsDragging(true);
//       context.setDraggedId(id);
//       context.setDraggedElementSize({ width: rect.width, height: rect.height });
//     }
//   }
// };

// element.addEventListener("dragstart", (e) => e.preventDefault());
// element.addEventListener("mousedown", mouseDown);
// document.addEventListener("mouseup", mouseUp);
// document.addEventListener("mousemove", mouseMove);

// return () => {
//   element.removeEventListener("mousedown", mouseDown);
//   document.removeEventListener("mouseup", mouseUp);
//   document.removeEventListener("mousemove", mouseMove);
// };
