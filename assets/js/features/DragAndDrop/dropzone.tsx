import * as React from "react";

import { useDragAndDropContext } from "./context";
import type { DragAndDropContextValue } from "./context";

export function useDropZone({ id }: { id: string }) {
  const context = useDragAndDropContext();
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const handler = new DropZoneElement(id, ref.current, context);
    handler.bindEvents();

    return () => handler.unbindEvents();
  }, [ref]);

  return {
    ref,
    isOver: context.overDropZoneId === id,
  };
}

class DropZoneElement {
  private id: string;
  private el: HTMLElement;
  private context: DragAndDropContextValue;

  // Event handlers binded to this instance.
  private mouseUp: () => void;
  private mouseMove: () => void;

  private indexInDropZone: number;

  constructor(id: string, el: HTMLElement, context: DragAndDropContextValue) {
    this.id = id;
    this.el = el;
    this.context = context;
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
      this.context.onDrop(this.id, this.context.getDraggedId()!, this.indexInDropZone);
    }
  }

  onMouseMove(e: MouseEvent) {
    if (this.context.getIsDragging()) {
      const r = this.el.getBoundingClientRect();
      const isOver = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;

      if (isOver) {
        this.context.setOverDropZoneId(this.id);
        this.indexInDropZone = this.calculateIndexInDropZone(e.clientY);
      }
    } else {
      this.context.setOverDropZoneId(null);
    }
  }

  private calculateIndexInDropZone(clientY: number): number {
    const items = this.context.getDropZoneItems(this.id);

    const index = items.findIndex((item) => {
      const rect = item.rect;

      return rect.top < clientY && rect.bottom > clientY;
    });

    return index === -1 ? items.length : index;
  }
}
