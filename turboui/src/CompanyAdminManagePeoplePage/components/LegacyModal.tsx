import React from "react";
import { createPortal } from "react-dom";

import { IconX } from "../../icons";

export type LegacyModalSize = "xs" | "sm" | "base" | "lg" | "xl";

const legacyModalSizes: Record<LegacyModalSize, string> = {
  xs: "400px",
  sm: "500px",
  base: "700px",
  lg: "900px",
  xl: "1200px",
};

export function LegacyModal({
  isOpen,
  onClose,
  title,
  children,
  size = "base",
  padding = "32px",
  testId,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: LegacyModalSize;
  padding?: string;
  testId?: string;
}) {
  React.useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const width = legacyModalSizes[size];

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      data-test-id={testId}
    >
      <div
        className="bg-surface-base border border-surface-outline rounded-lg shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)] max-w-[95%] flex flex-col overflow-y-auto"
        style={{ width, maxHeight: "90%", height: "auto", padding }}
      >
        {title && (
          <div className="flex items-center justify-between text-lg pb-6">
            <h1 className="font-bold">{title}</h1>
            <button
              type="button"
              className="hover:cursor-pointer text-content-dimmed hover:text-content-accent transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <IconX size={20} />
            </button>
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
