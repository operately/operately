import React from "react";

import classNames from "classnames";
import { useFileDragAndDrop } from "@/hooks/useFileDragAndDrop";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";

export function FileDragAndDropArea({ children }) {
  const { setFiles } = useNewFileModalsContext();
  const { isFileDragging, onDragLeave, onDragOver, onDrop } = useFileDragAndDrop(setFiles);

  const overlayClassName = classNames(
    "fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-50",
    isFileDragging ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
  );

  const messageClassName = classNames(
    "p-6 bg-callout-info text-white text-sm rounded-md shadow-lg",
    "transition-transform transform scale-95 duration-300",
    isFileDragging ? "scale-100 opacity-100" : "scale-95 opacity-0",
  );

  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className="">
      {children}

      <div className={overlayClassName}>
        <div className="flex items-center justify-center h-full">
          <div className={messageClassName}>Drop files to upload them to Resource Hub</div>
        </div>
      </div>
    </div>
  );
}
