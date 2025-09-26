import * as React from "react";

import type { DragAndDropContextValue } from "./context";

import { useDragAndDropContext } from "./context";
import { DRAG_DISTANCE_INERTIA } from "./constants";

interface UseDraggableOptions {
  id: string;
  zoneId: string;
  disabled?: boolean;
  handle?: React.RefObject<HTMLElement | null>;
  type?: string;
}

export function useDraggable({ id, zoneId, disabled = false, handle, type = "default" }: UseDraggableOptions) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const context = useDragAndDropContext();

  React.useEffect(() => {
    if (!ref.current || disabled) return;

    const handler = new DraggableElement(id, ref.current!, context, zoneId, handle?.current || null, type);
    handler.bindEvents();
    return () => handler.unbindEvents();
  }, [ref, id, zoneId, disabled, handle?.current, type]);

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

  // ID of the drop zone where the element is being dragged from
  public zoneId: string;

  // The DOM element (ref) that is being dragged
  private el: HTMLElement;

  // Optional handle element that activates dragging
  private handle: HTMLElement | null;

  private type: string;

  // State of the dragging
  private isDragging = false;
  private isMouseDown = false;

  // Position of the mouse when the dragging started
  private mouseDownPosition: { x: number; y: number } | null = null;

  // The size and position of the element when the dragging started
  private elementRect: DOMRect | null = null;
  private dragHeight = 0;
  private placeholder: HTMLElement | null = null;

  // The context of the DragAndDropProvider, used
  // to propagate the dragging state to the context
  private context: DragAndDropContextValue;

  // Event listeners that are binded to this instance
  // and need to be unbinded when the instance is destroyed
  private mouseDown: (e: MouseEvent) => void;
  private mouseUp: () => void;
  private mouseMove: (e: MouseEvent) => void;
  private dragStart: (e: DragEvent) => void;

  constructor(
    id: string,
    el: HTMLElement,
    context: DragAndDropContextValue,
    zoneId: string,
    handle: HTMLElement | null,
    type: string,
  ) {
    this.context = context;

    this.id = id;
    this.el = el;
    this.handle = handle || el;
    this.zoneId = zoneId;
    this.type = type;
    this.mouseDownPosition = null;

    this.mouseDown = this.onMouseDown.bind(this);
    this.mouseUp = this.onMouseUp.bind(this);
    this.mouseMove = this.onMouseMove.bind(this);
    this.dragStart = this.onDragStart.bind(this);

    this.el.setAttribute("draggable-id", this.id);
    this.el.setAttribute("data-draggable-item", "true");
    this.el.setAttribute("data-drag-type", this.type);

    this.setDragAttributes(true);
  }

  bindEvents() {
    const target = this.handle || this.el;
    target.addEventListener("dragstart", this.dragStart);
    target.addEventListener("mousedown", this.mouseDown);
    document.addEventListener("mouseup", this.mouseUp);
    document.addEventListener("mousemove", this.mouseMove);
  }

  unbindEvents() {
    const target = this.handle || this.el;
    target.removeEventListener("mousedown", this.mouseDown);
    target.removeEventListener("dragstart", this.dragStart);
    document.removeEventListener("mouseup", this.mouseUp);
    document.removeEventListener("mousemove", this.mouseMove);

    this.setDragAttributes(false);
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

    this.setMinHeightForDropZones();

    this.isDragging = true;
    this.elementRect = this.el.getBoundingClientRect();
    const handleRect = this.handle ? this.handle.getBoundingClientRect() : this.elementRect;
    this.dragHeight = this.type === "milestone" ? Math.max(handleRect.height + 32, 64) : this.elementRect.height;

    this.context.setIsDragging(this.isDragging);
    this.context.setDraggedId(this.id);
    this.context.setDraggedElementSize({ width: this.elementRect.width, height: this.dragHeight });
    this.context.setSourceZoneId(this.zoneId);

    this.insertPlaceholder();
  }

  stopDragging() {
    this.resetElementStyle();
    this.resetMinHeightForDropZones();

    this.isDragging = false;
    this.context.setIsDragging(false);
    this.context.setDraggedId(null);
    this.context.setDraggedElementSize({ width: 0, height: 0 });
    this.context.setDropIndex(0);
    this.context.setOverDropZoneId(null);
    this.context.setSourceZoneId(null);
    this.dragHeight = 0;

    if (this.placeholder && this.placeholder.parentElement) {
      this.placeholder.parentElement.removeChild(this.placeholder);
    }
    this.placeholder = null;
  }

  followMouse(e: MouseEvent) {
    const left = e.clientX - this.mouseDownPosition!.x + this.elementRect!.width / 2 + this.elementRect!.left;
    const top = e.clientY - this.mouseDownPosition!.y + this.dragHeight / 2 + this.elementRect!.top;

    Object.assign(this.el.style, {
      position: "fixed",
      left: left + "px",
      top: top + "px",
      zIndex: "10000",
      pointerEvents: "none",
      userSelect: "none",
      transform: "translate(-50%, -50%)",
      width: this.el.getBoundingClientRect().width + "px",
      height: this.dragHeight + "px",
    });
  }

  resetElementStyle() {
    this.el.removeAttribute("style");
  }

  setMinHeightForDropZones() {
    document.querySelectorAll("[drop-zone]").forEach((e: Element) => {
      const dropZone = e as HTMLElement;
      dropZone.style.minHeight = dropZone.getBoundingClientRect().height + "px";
    });
  }

  resetMinHeightForDropZones() {
    document.querySelectorAll("[drop-zone]").forEach((el: Element) => {
      const dropZone = el as HTMLElement;
      dropZone.style.minHeight = "";
    });
  }

  private setDragAttributes(enable: boolean) {
    const target = this.handle || this.el;

    if (enable) {
      target.setAttribute("draggable", "true");
      target.setAttribute("data-drag-handle", this.handle ? "true" : "false");
    } else {
      target.removeAttribute("draggable");
      target.removeAttribute("data-drag-handle");
      this.el.removeAttribute("data-draggable-item");
      this.el.removeAttribute("data-drag-type");
      this.el.removeAttribute("draggable-id");
    }
  }

  private insertPlaceholder() {
    const parent = this.el.parentElement;
    if (!parent) return;

    const placeholder = document.createElement(this.el.tagName.toLowerCase());
    placeholder.setAttribute("data-drag-placeholder", "true");
    placeholder.style.height = `${this.dragHeight}px`;
    placeholder.style.width = "100%";
    placeholder.style.visibility = "hidden";
    placeholder.style.pointerEvents = "none";

    parent.insertBefore(placeholder, this.el);
    this.placeholder = placeholder;
  }
}
