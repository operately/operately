import * as React from "react";

import type { DragAndDropContextValue } from "./context";

import { useDragAndDropContext } from "./context";
import { DRAG_DISTANCE_INERTIA } from "./constants";

export function useDraggable({ id }: { id: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const context = useDragAndDropContext();

  React.useLayoutEffect(() => {
    if (!ref.current) return;

    const handler = new DraggableElement(id, ref.current!, context);
    handler.bindEvents();
    return () => handler.unbindEvents();
  }, [ref]);

  return { ref, isDragging: context.draggedId === id };
}

class DraggableElement {
  //
  // This class is used to handle the dragging of an element.
  // It is attached to a DOM element and listens to mouse events
  // to start and stop dragging, and to follow the mouse when
  // the element is being dragged.
  //
  // The class is used in the useDraggable hook.
  //
  // The class is responsible for:
  //
  // - Starting and stopping dragging
  // - Following the mouse when the element is being dragged
  // - Resetting the element style when dragging stops
  // - Binding and unbinding event listeners
  // - Propagating the dragging state to the DragAndDropContext
  //
  // Usage:
  //
  // const context = useDragAndDropContext();
  // const ref = React.useRef<HTMLDivElement | null>(null);
  //
  // React.useLayoutEffect(() => {
  //   const handler = new DraggableElement(id, ref.current!, context);
  //   handler.bindEvents();
  //   return () => handler.unbindEvents();
  // }, [ref]);
  //
  // return { ref };
  //

  // ID of the draggable element, usually the UUID of the Task
  private id: string;

  // The DOM element (ref) that is being dragged
  private el: HTMLElement;

  // State of the dragging
  private isDragging = false;
  private isMouseDown = false;

  // Position of the mouse when the dragging started
  private mouseDownPosition: { x: number; y: number } | null = null;

  // The size and position of the element when the dragging started
  private elementRect: DOMRect | null = null;

  // The context of the DragAndDropProvider, used
  // to propagate the dragging state to the context
  private context: DragAndDropContextValue;

  // Event listeners that are binded to this instance
  // and need to be unbinded when the instance is destroyed
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

    this.el.setAttribute("draggable", "true");
    this.el.setAttribute("draggable-id", this.id);
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
    this.context.setDraggedElementSize({ width: this.elementRect.width, height: this.elementRect.height });
  }

  stopDragging() {
    this.resetElementStyle();

    this.isDragging = false;
    this.context.setIsDragging(false);
    this.context.setDraggedId(null);
    this.context.setDraggedElementSize({ width: 0, height: 0 });
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
