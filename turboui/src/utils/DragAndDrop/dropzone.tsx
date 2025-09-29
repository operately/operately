import * as React from "react";

import { useDragAndDropContext } from "./context";
import type { DragAndDropContextValue } from "./context";

interface Props {
  id: string;
  /**
   * Optional array of dependencies. If any value in this array changes,
   * the DropZoneElement will be re-instantiated and events rebound.
   */
  dependencies?: any[];
}

export function useDropZone({ id, dependencies = [] }: Props) {
  const context = useDragAndDropContext();
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const handler = new DropZoneElement(id, ref.current, context);
    handler.bindEvents();

    return () => handler.unbindEvents();
  }, [ref, ...dependencies]);

  return {
    ref,
    isOver: context.overDropZoneId === id,
    dropIndex: context.overDropZoneId === id ? context.dropIndex : null,
    draggedElementHeight: context.overDropZoneId === id ? context.draggedElementSize.height : null,
    draggedId: context.overDropZoneId === id ? context.draggedId : null,
    isSourceZone: context.sourceZoneId === id,
  };
}

class DropZoneElement {
  private id: string;
  private el: HTMLElement;
  private context: DragAndDropContextValue;

  // Event handlers binded to this instance.
  private mouseUp: () => void;
  private mouseMove: (e: MouseEvent) => void;
  private touchEnd: () => void;
  private touchMove: (e: TouchEvent) => void;

  private indexInDropZone: number;

  constructor(id: string, el: HTMLElement, context: DragAndDropContextValue) {
    this.id = id;
    this.el = el;
    this.context = context;
    this.indexInDropZone = 0;

    this.mouseUp = this.onMouseUp.bind(this);
    this.mouseMove = this.onMouseMove.bind(this);
    this.touchEnd = this.onTouchEnd.bind(this);
    this.touchMove = this.onTouchMove.bind(this);

    this.el.setAttribute("drop-zone", "true");
    this.el.id = this.id;
  }

  bindEvents() {
    this.el.addEventListener("mouseup", this.mouseUp);
    this.el.addEventListener("touchend", this.touchEnd);
    document.addEventListener("mousemove", this.mouseMove);
    document.addEventListener("touchmove", this.touchMove, { passive: false });
  }

  unbindEvents() {
    this.el.removeEventListener("mouseup", this.mouseUp);
    this.el.removeEventListener("touchend", this.touchEnd);
    document.removeEventListener("mousemove", this.mouseMove);
    document.removeEventListener("touchmove", this.touchMove);
  }

  onMouseUp() {
    if (this.context.getIsDragging()) {
      const dropSuccessful = this.context.onDrop(this.id, this.context.draggedIdRef.current!, this.indexInDropZone);
      // Reset drag state regardless of success/failure
      if (dropSuccessful) {
        // Additional success handling could go here if needed
      }
    }
  }

  onMouseMove(e: MouseEvent) {
    this.handlePointerMove(e.clientX, e.clientY);
  }

  onTouchEnd() {
    if (this.context.getIsDragging()) {
      const dropSuccessful = this.context.onDrop(this.id, this.context.draggedIdRef.current!, this.indexInDropZone);
      // Reset drag state regardless of success/failure
      if (dropSuccessful) {
        // Additional success handling could go here if needed
      }
    }
  }

  onTouchMove(e: TouchEvent) {
    if (!this.context.getIsDragging()) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (!touch) return;

    this.handlePointerMove(touch.clientX, touch.clientY);
  }

  private handlePointerMove(clientX: number, clientY: number) {
    if (this.context.getIsDragging()) {
      const r = this.el.getBoundingClientRect();
      const isOver = clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;

      if (isOver) {
        this.indexInDropZone = this.calculateIndexInDropZone(clientY);

        this.context.setOverDropZoneId(this.id);
        this.context.setDropIndex(this.indexInDropZone);
      }
    } else {
      this.indexInDropZone = 0;
      this.context.setOverDropZoneId(null);
    }
  }

  private calculateIndexInDropZone(clientY: number): number {
    let draggableChildren = Array.from(this.el.querySelectorAll("[draggable=true]")).filter(
      (e) => e.getAttribute("draggable-id") !== this.context.draggedIdRef.current,
    ) as HTMLElement[];

    if (draggableChildren.length === 0) return 0;

    let index = draggableChildren.findIndex((el) => {
      const r = el.getBoundingClientRect();
      return clientY < r.top + r.height * 0.9;
    });

    return index === -1 ? draggableChildren.length : index;
  }
}
