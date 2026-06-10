import { useCallback, useState } from "react";

interface FileDragAndDrop {
  isFileDragging: boolean;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function useFileDragAndDrop(callback: (files: File[]) => void): FileDragAndDrop {
  const [isFileDragging, setIsFileDragging] = useState(false);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsFileDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsFileDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      setIsFileDragging(false);
      const files = event.dataTransfer.files;

      if (files && files.length > 0) {
        callback(Array.from(files));
      }
    },
    [callback],
  );

  return {
    isFileDragging,
    onDragOver,
    onDragLeave,
    onDrop,
  };
}
