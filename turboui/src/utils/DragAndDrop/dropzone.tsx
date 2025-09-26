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
  accepts?: string[];
}

export function useDropZone({ id, dependencies = [], accepts }: Props) {
  const context = useDragAndDropContext();
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const handler = new DropZoneElement(id, ref.current, context, accepts);
    handler.bindEvents();

    return () => handler.unbindEvents();
  }, [ref, ...dependencies, accepts?.join(",")]);

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
  private accepts?: string[];

  // Event handlers binded to this instance.
  private mouseUp: () => void;
  private mouseMove: (e: MouseEvent) => void;

  private indexInDropZone: number;

  constructor(id: string, el: HTMLElement, context: DragAndDropContextValue, accepts?: string[]) {
    this.id = id;
    this.el = el;
    this.context = context;
    this.accepts = accepts;
    this.indexInDropZone = 0;

    this.mouseUp = this.onMouseUp.bind(this);
    this.mouseMove = this.onMouseMove.bind(this);
  }

  bindEvents() {
    this.el.addEventListener("mouseup", this.mouseUp);
    document.addEventListener("mousemove", this.mouseMove);
  }

  unbindEvents() {
    this.el.removeEventListener("mouseup", this.mouseUp);
    document.removeEventListener("mousemove", this.mouseMove);
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
    if (this.context.getIsDragging()) {
      if (!this.isAcceptedDrag()) {
        this.context.setOverDropZoneId(null);
        return;
      }

      const r = this.el.getBoundingClientRect();
      const isOver = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;

      if (isOver) {
        this.indexInDropZone = this.calculateIndexInDropZone(e.clientY);

        this.context.setOverDropZoneId(this.id);
        this.context.setDropIndex(this.indexInDropZone);
      }
    } else {
      this.indexInDropZone = 0;
      this.context.setOverDropZoneId(null);
    }
  }

  private isAcceptedDrag(): boolean {
    if (!this.accepts || this.accepts.length === 0) {
      return true;
    }

    const draggedId = this.context.draggedIdRef.current;
    if (!draggedId) return false;

    const draggedElement = document.querySelector<HTMLElement>(
      `[data-draggable-item="true"][draggable-id="${draggedId}"]`,
    );

    if (!draggedElement) return false;

    const dragType = draggedElement.getAttribute("data-drag-type");
    if (!dragType) return false;

    return this.accepts.includes(dragType);
  }

  private calculateIndexInDropZone(clientY: number): number {
    const draggedId = this.context.draggedIdRef.current;

    let draggableChildren = Array.from(this.el.querySelectorAll('[data-draggable-item="true"]')).filter((element) => {
      if (element.getAttribute("draggable-id") === draggedId) {
        return false;
      }

      if (!this.accepts || this.accepts.length === 0) {
        return true;
      }

      const dragType = element.getAttribute("data-drag-type");
      return dragType ? this.accepts.includes(dragType) : false;
    }) as HTMLElement[];

    if (draggableChildren.length === 0) return 0;

    let index = draggableChildren.findIndex((el) => {
      const r = el.getBoundingClientRect();
      const threshold = r.top + Math.min(r.height * 0.5, 60);
      return clientY < threshold;
    });

    return index === -1 ? draggableChildren.length : index;
  }
}
