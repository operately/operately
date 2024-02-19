import React from "react";

type OnDropFunction = (dropZoneId: string, draggedId: string, indexInDropZone: number) => void;

export interface DragAndDropContextValue {
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
    setDraggedId,
    setDraggedElementSize,

    onDrop,
  };

  return <DragAndDropContext.Provider value={value}>{children}</DragAndDropContext.Provider>;
}
