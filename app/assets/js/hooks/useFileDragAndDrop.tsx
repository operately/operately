import React, { useState, useCallback } from "react";

interface FileDragAndDrop {
  isFileDragging: boolean;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function useFileDragAndDrop(callback: (file: File[]) => void): FileDragAndDrop {
  const [isFileDragging, setIsFileDragging] = useState(false);

  const onDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsFileDragging(true);
    },
    [setIsFileDragging],
  );

  const onDragLeave = useCallback(() => {
    setIsFileDragging(false);
  }, [setIsFileDragging]);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      setIsFileDragging(false);
      const files = event.dataTransfer.files;

      if (files && files.length > 0) {
        if (callback) {
          callback(Array.from(files));
        }
      }
    },
    [callback, setIsFileDragging],
  );

  return {
    isFileDragging,
    onDragOver,
    onDragLeave,
    onDrop,
  };
}
