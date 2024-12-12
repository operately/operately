import React from "react";

import classNames from "classnames";
import { useFileDragAndDrop } from "@/hooks/useFileDragAndDrop";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";

export function FileDragAndDropArea({ children }) {
  const { setFile } = useNewFileModalsContext();
  const { isFileDragging, onDragLeave, onDragOver, onDrop } = useFileDragAndDrop(setFile);

  const messageClassName = classNames(
    "p-4 bg-callout-info text-white text-sm rounded-md shadow-lg",
    "fixed bottom-0 left-1/2 transform -translate-x-1/2",
    "transition-transform duration-300",
    isFileDragging ? "translate-y-[-5vh]" : "translate-y-full",
  );

  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className="">
      {children}

      <div className={messageClassName}>Drop files to upload them to Resource Hub</div>
    </div>
  );
}
