import { useCallback, useRef, useState } from "react";

interface FileDragAndDrop {
  isFileDragging: boolean;
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}

// The browser exposes the kinds of data being dragged through `dataTransfer.types`.
// External file drags always include the special "Files" entry, which lets us
// distinguish them from internal drags (reordering nodes, selecting text, etc.).
function dragContainsFiles(event: React.DragEvent<HTMLDivElement>): boolean {
  const types = event.dataTransfer?.types;

  if (!types) return false;

  return Array.from(types).includes("Files");
}

export function useFileDragAndDrop(callback: (files: File[]) => void): FileDragAndDrop {
  const [isFileDragging, setIsFileDragging] = useState(false);

  // `dragenter`/`dragleave` also fire while moving between descendant elements.
  // Counting active enters/leaves keeps the dropzone stable instead of flickering
  // every time the pointer crosses a child boundary.
  const dragDepth = useRef(0);

  const reset = useCallback(() => {
    dragDepth.current = 0;
    setIsFileDragging(false);
  }, []);

  const onDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!dragContainsFiles(event)) return;

    event.preventDefault();
    dragDepth.current += 1;
    setIsFileDragging(true);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!dragContainsFiles(event)) return;

    // Preventing the default is required for the element to become a valid drop target.
    event.preventDefault();
    setIsFileDragging(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!dragContainsFiles(event)) return;

    dragDepth.current = Math.max(0, dragDepth.current - 1);

    if (dragDepth.current === 0) {
      setIsFileDragging(false);
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      reset();

      const files = event.dataTransfer?.files;

      if (files && files.length > 0) {
        callback(Array.from(files));
      }
    },
    [callback, reset],
  );

  return {
    isFileDragging,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };
}
