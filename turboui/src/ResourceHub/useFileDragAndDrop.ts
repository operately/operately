import { useEffect, useRef, useState } from "react";

interface FileDragAndDrop {
  isFileDragging: boolean;
}

// The browser exposes the kinds of data being dragged through `dataTransfer.types`.
// External file drags always include the special "Files" entry, which lets us
// distinguish them from internal drags (reordering nodes, selecting text, etc.).
function dragContainsFiles(event: DragEvent): boolean {
  const types = event.dataTransfer?.types;

  if (!types) return false;

  return Array.from(types).includes("Files");
}

// The dropzone listens on the whole document rather than on a single wrapper element.
// The wrapper only stretched to its content height, so on sparse pages the droppable
// region was tiny and easy to miss. Listening at the document level turns the entire
// view into a valid drop target, matching the full-screen overlay we render.
export function useFileDragAndDrop(callback: (files: File[]) => void): FileDragAndDrop {
  const [isFileDragging, setIsFileDragging] = useState(false);

  // Keep the latest callback in a ref so the event listeners stay stable and don't
  // need to be re-attached whenever the caller passes a new function instance.
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // `dragenter`/`dragleave` also fire while moving between nested elements.
    // Counting active enters/leaves keeps the dropzone stable instead of flickering
    // every time the pointer crosses a child boundary.
    let dragDepth = 0;

    const reset = () => {
      dragDepth = 0;
      setIsFileDragging(false);
    };

    const onDragEnter = (event: DragEvent) => {
      if (!dragContainsFiles(event)) return;

      event.preventDefault();
      dragDepth += 1;
      setIsFileDragging(true);
    };

    const onDragOver = (event: DragEvent) => {
      if (!dragContainsFiles(event)) return;

      // Preventing the default is required for the document to become a valid drop target.
      event.preventDefault();
      setIsFileDragging(true);
    };

    const onDragLeave = (event: DragEvent) => {
      if (!dragContainsFiles(event)) return;

      dragDepth = Math.max(0, dragDepth - 1);

      if (dragDepth === 0) {
        setIsFileDragging(false);
      }
    };

    const onDrop = (event: DragEvent) => {
      if (!dragContainsFiles(event)) return;

      event.preventDefault();
      reset();

      const files = event.dataTransfer?.files;

      if (files && files.length > 0) {
        callbackRef.current(Array.from(files));
      }
    };

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);

    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, []);

  return { isFileDragging };
}
