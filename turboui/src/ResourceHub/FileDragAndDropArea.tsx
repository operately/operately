import * as React from "react";
import { useTranslation } from "react-i18next";

import classNames from "../utils/classnames";
import { useFileDragAndDrop } from "./useFileDragAndDrop";

interface FileDragAndDropAreaProps {
  children: React.ReactNode;
  onFilesDropped: (files: File[]) => void;
  label?: string;
}

export function FileDragAndDropArea({ children, onFilesDropped, label }: FileDragAndDropAreaProps) {
  const { t } = useTranslation();
  const { isFileDragging } = useFileDragAndDrop(onFilesDropped);

  const overlayClassName = classNames(
    "fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-50",
    isFileDragging ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
  );

  const messageClassName = classNames(
    "p-6 bg-callout-info-bg text-white text-sm rounded-md shadow-lg",
    "transition-transform transform scale-95 duration-300",
    isFileDragging ? "scale-100 opacity-100" : "scale-95 opacity-0",
  );

  return (
    <>
      {children}

      <div className={overlayClassName}>
        <div className="flex items-center justify-center h-full">
          <div className={messageClassName}>{label ?? t("Drop files here to upload them")}</div>
        </div>
      </div>
    </>
  );
}
