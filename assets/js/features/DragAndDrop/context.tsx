import React from "react";

type OnDropFunction = (dropZoneId: string, draggedId: string, indexInDropZone: number) => void;

export interface DragAndDropContextValue {
  getIsDragging: () => boolean;
  setIsDragging: (isDragging: boolean) => void;

  getDraggedId: () => string | null;
  setDraggedId: (id: string | null) => void;

  getDraggedElementSize: () => { width: number; height: number };
  setDraggedElementSize: (size: { width: number; height: number }) => void;

  overDropZoneId: string | null;
  setOverDropZoneId: (id: string | null) => void;

  registerDraggable: (id: string, zoneId: string, rect: DOMRect) => void;
  getDropZoneItems: (id: string) => any[];

  onDrop: OnDropFunction;
}

const DragAndDropContext = React.createContext<DragAndDropContextValue | null>(null);

export function useDragAndDropContext(): DragAndDropContextValue {
  const context = React.useContext(DragAndDropContext);
  if (!context) throw new Error("useDragAndDropContext must be used within a DragAndDropProvider");

  return context;
}

export function DragAndDropProvider({ children, onDrop }: { children: React.ReactNode; onDrop: OnDropFunction }) {
  const internalMutableState = React.useRef({
    isDragging: false,
    draggedId: "",
    draggedElementSize: { width: 0, height: 0 },
    dropZones: {},
  });

  const [overDropZoneId, setOverDropZoneId] = React.useState<string | null>(null);

  const value = {
    getIsDragging: () => internalMutableState.current.isDragging,
    setIsDragging: (isDragging: boolean) => {
      internalMutableState.current.isDragging = isDragging;
    },

    getDraggedId: () => internalMutableState.current.draggedId,
    setDraggedId: (id: string) => {
      internalMutableState.current.draggedId = id;
    },

    getDraggedElementSize: () => internalMutableState.current.draggedElementSize,
    setDraggedElementSize: (size: { width: number; height: number }) => {
      internalMutableState.current.draggedElementSize = size;
    },

    getDropZoneItems: (id: string) => {
      return internalMutableState.current.dropZones[id]?.items || [];
    },

    registerDraggable: (id: string, zoneId: string, rect: DOMRect) => {
      let zone = internalMutableState.current.dropZones[zoneId];

      if (!zone) {
        zone = { items: [] };
        internalMutableState.current.dropZones[zoneId] = zone;
      }

      zone.items.push({
        id,
        rect,
      });
    },

    onDrop,

    overDropZoneId,
    setOverDropZoneId,
  };

  return <DragAndDropContext.Provider value={value}>{children}</DragAndDropContext.Provider>;
}
