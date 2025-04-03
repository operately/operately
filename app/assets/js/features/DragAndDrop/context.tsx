import React from "react";

type OnDropFunction = (dropZoneId: string, draggedId: string, indexInDropZone: number) => void;

export interface DragAndDropContextValue {
  getIsDragging: () => boolean;
  setIsDragging: (isDragging: boolean) => void;

  onDrop: OnDropFunction;

  overDropZoneId: string | null;
  setOverDropZoneId: (id: string | null) => void;

  dropIndex: number;
  setDropIndex: (index: number) => void;

  draggedElementSize: { width: number; height: number };
  setDraggedElementSize: (size: { width: number; height: number }) => void;

  draggedId: string | null;
  setDraggedId: (id: string | null) => void;

  draggedIdRef: React.MutableRefObject<string | null>;

  sourceZoneId: string | null;
  setSourceZoneId: (id: string | null) => void;
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
    dropZones: {},
  });

  const [overDropZoneId, setOverDropZoneId] = React.useState<string | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number>(0);
  const [draggedElementSize, setDraggedElementSize] = React.useState({ width: 0, height: 0 });
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [sourceZoneId, setSourceZoneId] = React.useState<string | null>(null);

  const draggedIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    draggedIdRef.current = draggedId;
  }, [draggedId]);

  const value = {
    internalMutableState: internalMutableState.current,

    getIsDragging: () => internalMutableState.current.isDragging,
    setIsDragging: (isDragging: boolean) => {
      internalMutableState.current.isDragging = isDragging;
    },

    getDropZoneItems: (id: string) => {
      return internalMutableState.current.dropZones[id]?.items || [];
    },

    onDrop,

    overDropZoneId,
    setOverDropZoneId,

    dropIndex,
    setDropIndex,

    draggedElementSize,
    setDraggedElementSize,

    draggedId,
    draggedIdRef,
    setDraggedId,

    sourceZoneId,
    setSourceZoneId,
  };

  return <DragAndDropContext.Provider value={value}>{children}</DragAndDropContext.Provider>;
}
