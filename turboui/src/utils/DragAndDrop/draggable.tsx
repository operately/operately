import * as React from "react";

import type { DragAndDropContextValue } from "./context";

import { useDragAndDropContext } from "./context";
import { DRAG_DISTANCE_INERTIA } from "./constants";

export function useDraggable({ id, zoneId, disabled = false }: { id: string; zoneId: string; disabled?: boolean }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const context = useDragAndDropContext();

  React.useEffect(() => {
    if (!ref.current || disabled) return;

    const handler = new DraggableElement(id, ref.current!, context, zoneId);
    handler.bindEvents();
    return () => handler.unbindEvents();
  }, [ref, id, zoneId, disabled]);

  return { ref, isDragging: context.draggedId === id };
}

class DraggableElement {
  //
  // This class is used to handle the dragging of an element.
  // It is attached to a DOM element and listens to mouse and touch events
  // to start and stop dragging, and to follow the pointer when
  // the element is being dragged.
  //
  // The class is used in the useDraggable hook.
  //
  // The class is responsible for:
  //
  // - Starting and stopping dragging
  // - Following the pointer when the element is being dragged
  // - Resetting the element style when dragging stops
  // - Binding and unbinding event listeners
  // - Propagating the dragging state to the DragAndDropContext
  // - Supporting both mouse and touch events for mobile compatibility
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

  // State of the dragging
  private isDragging = false;
  private isPointerDown = false;

  // Position of the pointer when the dragging started
  private pointerDownPosition: { x: number; y: number } | null = null;

  // The size and position of the element when the dragging started
  private elementRect: DOMRect | null = null;

  // Long press timer for mobile devices
  private longPressTimer: number | null = null;
  private longPressDuration = 200; // ms - shorter for more responsive feel
  private longPressTriggered = false;
  private touchStartTime = 0;

  // The context of the DragAndDropProvider, used
  // to propagate the dragging state to the context
  private context: DragAndDropContextValue;

  // Event listeners that are binded to this instance
  // and need to be unbinded when the instance is destroyed
  private mouseDown: (e: MouseEvent) => void;
  private mouseUp: () => void;
  private mouseMove: (e: MouseEvent) => void;
  private touchStart: (e: TouchEvent) => void;
  private touchEnd: () => void;
  private touchMove: (e: TouchEvent) => void;
  private dragStart: (e: DragEvent) => void;

  constructor(id: string, el: HTMLElement, context: DragAndDropContextValue, zoneId: string) {
    this.context = context;

    this.id = id;
    this.el = el;
    this.zoneId = zoneId;
    this.pointerDownPosition = null;

    this.mouseDown = this.onMouseDown.bind(this);
    this.mouseUp = this.onMouseUp.bind(this);
    this.mouseMove = this.onMouseMove.bind(this);
    this.touchStart = this.onTouchStart.bind(this);
    this.touchEnd = this.onTouchEnd.bind(this);
    this.touchMove = this.onTouchMove.bind(this);
    this.dragStart = this.onDragStart.bind(this);

    this.el.setAttribute("draggable", "true");
    this.el.setAttribute("draggable-id", this.id);

    // Enable touch events for mobile drag and drop - allow pan-y for scrolling but prevent pan-x
    this.el.style.touchAction = "pan-y pinch-zoom";
  }

  bindEvents() {
    this.el.addEventListener("dragstart", this.dragStart);
    this.el.addEventListener("mousedown", this.mouseDown);
    this.el.addEventListener("touchstart", this.touchStart, { passive: false, capture: true });
    document.addEventListener("mouseup", this.mouseUp);
    document.addEventListener("mousemove", this.mouseMove);
    document.addEventListener("touchend", this.touchEnd);
    document.addEventListener("touchmove", this.touchMove, { passive: false });
  }

  unbindEvents() {
    this.el.removeEventListener("dragstart", this.dragStart);
    this.el.removeEventListener("mousedown", this.mouseDown);
    this.el.removeEventListener("touchstart", this.touchStart, { capture: true } as any);
    document.removeEventListener("mouseup", this.mouseUp);
    document.removeEventListener("mousemove", this.mouseMove);
    document.removeEventListener("touchend", this.touchEnd);
    document.removeEventListener("touchmove", this.touchMove);
  }

  onDragStart(e: DragEvent) {
    e.preventDefault();
  }

  onMouseDown(e: MouseEvent) {
    this.isPointerDown = true;
    this.pointerDownPosition = { x: e.clientX, y: e.clientY };
  }

  onMouseUp() {
    this.isPointerDown = false;
    this.clearLongPressTimer();
    this.stopDragging();
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isPointerDown) return;

    if (this.isDragging) {
      this.followPointer(e.clientX, e.clientY);
    } else {
      const dx = Math.abs(this.pointerDownPosition!.x - e.clientX);
      const dy = Math.abs(this.pointerDownPosition!.y - e.clientY);

      if (dx > DRAG_DISTANCE_INERTIA || dy > DRAG_DISTANCE_INERTIA) {
        this.clearLongPressTimer();
        this.startDragging();
      }
    }
  }

  onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    if (!touch) return;

    // Stop propagation to prevent multiple handlers from firing
    e.stopPropagation();

    this.isPointerDown = true;
    this.longPressTriggered = false;
    this.touchStartTime = Date.now();
    this.pointerDownPosition = { x: touch.clientX, y: touch.clientY };

    // Start long press timer for mobile drag
    this.longPressTimer = window.setTimeout(() => {
      if (this.isPointerDown) {
        this.longPressTriggered = true;
        this.startDragging();
      }
    }, this.longPressDuration);
  }

  onTouchEnd() {
    // Only handle if this was our touch
    if (!this.isPointerDown) return;

    this.isPointerDown = false;
    this.longPressTriggered = false;
    this.touchStartTime = 0;
    this.clearLongPressTimer();
    this.stopDragging();
  }

  onTouchMove(e: TouchEvent) {
    if (!this.isPointerDown || e.touches.length !== 1) return;

    const touch = e.touches[0];
    if (!touch) return;

    if (this.isDragging) {
      e.preventDefault(); // Prevent scrolling while dragging
      this.followPointer(touch.clientX, touch.clientY);
    } else if (!this.longPressTriggered) {
      // Allow some time for touch to stabilize before checking movement
      const timeSinceStart = Date.now() - this.touchStartTime;
      if (timeSinceStart < 100) return; // Ignore movement for first 100ms

      const dx = Math.abs(this.pointerDownPosition!.x - touch.clientX);
      const dy = Math.abs(this.pointerDownPosition!.y - touch.clientY);

      // Use a much larger threshold for touch to account for natural finger movement and scrolling
      const TOUCH_MOVEMENT_THRESHOLD = 50; // pixels - very forgiving for mobile

      // If moved too much, cancel long press
      if (dx > TOUCH_MOVEMENT_THRESHOLD || dy > TOUCH_MOVEMENT_THRESHOLD) {
        this.clearLongPressTimer();
      }
    }
  }

  clearLongPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  startDragging() {
    if (this.isDragging) return;

    this.setMinHeightForDropZones();

    this.isDragging = true;
    this.elementRect = this.el.getBoundingClientRect();

    this.context.setIsDragging(this.isDragging);
    this.context.setDraggedId(this.id);
    this.context.setDraggedElementSize({ width: this.elementRect.width, height: this.elementRect.height });
    this.context.setSourceZoneId(this.zoneId);
  }

  stopDragging() {
    this.resetElementStyle();
    this.resetMinHeightForDropZones();
    this.clearLongPressTimer();

    this.isDragging = false;
    this.context.setIsDragging(false);
    this.context.setDraggedId(null);
    this.context.setDraggedElementSize({ width: 0, height: 0 });
  }

  followPointer(clientX: number, clientY: number) {
    const left = clientX - this.pointerDownPosition!.x + this.elementRect!.width / 2 + this.elementRect!.left;
    const top = clientY - this.pointerDownPosition!.y + this.elementRect!.height / 2 + this.elementRect!.top;

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

    // Manually check dropzones for touch events
    this.checkDropZones(clientX, clientY);
  }

  checkDropZones(clientX: number, clientY: number) {
    // Find the dropzone element under the touch point
    const dropZones = Array.from(document.querySelectorAll("[drop-zone]"));
    let foundDropZone: HTMLElement | null = null;

    for (const dropZone of dropZones) {
      const el = dropZone as HTMLElement;
      const rect = el.getBoundingClientRect();

      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        foundDropZone = el;
        break;
      }
    }

    if (foundDropZone) {
      const dropZoneId = foundDropZone.id;
      const dropIndex = this.calculateDropIndex(foundDropZone, clientY);

      this.context.setOverDropZoneId(dropZoneId);
      this.context.setDropIndex(dropIndex);
    } else {
      this.context.setOverDropZoneId(null);
      this.context.setDropIndex(0);
    }
  }

  calculateDropIndex(dropZone: HTMLElement, clientY: number): number {
    const draggableChildren = Array.from(dropZone.querySelectorAll("[draggable=true]")).filter(
      (e) => e.getAttribute("draggable-id") !== this.id,
    ) as HTMLElement[];

    if (draggableChildren.length === 0) return 0;

    const index = draggableChildren.findIndex((el) => {
      const rect = el.getBoundingClientRect();
      return clientY < rect.top + rect.height * 0.9;
    });

    return index === -1 ? draggableChildren.length : index;
  }

  resetElementStyle() {
    this.el.removeAttribute("style");
    // Reapply touchAction to maintain mobile drag functionality after reset
    this.el.style.touchAction = "pan-y pinch-zoom";
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
}
