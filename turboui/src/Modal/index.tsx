import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { IconX } from "../icons";

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Called when the modal should close
   */
  onClose: () => void;

  /**
   * Title to display in the modal header
   */
  title?: string;

  /**
   * Content to render inside the modal
   */
  children: React.ReactNode;

  /**
   * Size of the modal
   */
  size?: "xx-small" | "x-small" | "small" | "medium" | "large";

  /**
   * Whether to close the modal when clicking the backdrop
   */
  closeOnBackdropClick?: boolean;

  /**
   * Additional class names to apply to the content container
   */
  contentClassName?: string;

  /**
   * Padding to apply to the content container
   */
  contentPadding?: string;

  /**
   * Test ID for the modal
   */
  testId?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  closeOnBackdropClick = true,
  contentClassName = "",
  contentPadding = "p-6",
  testId,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  // Handle mounting the modal in the DOM
  useEffect(() => {
    setMounted(true);

    // Disable body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";

      // Handle ESC key to close the modal
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEsc);

      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEsc);
      };
    }
    return;
  }, [isOpen, onClose]);

  // Only close when the backdrop itself is clicked, not when clicks bubble from modal content.
  // Stopping propagation on the content would break Radix popovers (e.g. TimePicker) that
  // rely on click events reaching the document to detect outside dismiss.
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Determine modal width based on size
  const sizeClasses = {
    "xx-small": "max-w-xs",
    "x-small": "max-w-sm",
    small: "max-w-md",
    medium: "max-w-lg",
    large: "max-w-2xl",
  }[size];

  if (!mounted || !isOpen) {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      data-test-id={testId}
    >
      <div
        className={`bg-surface-base rounded-lg shadow-xl w-full max-h-[95vh] overflow-auto ${sizeClasses} ${contentClassName}`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-outline">
            <h2 className="text-lg font-semibold text-content-accent">{title}</h2>
            <button
              onClick={onClose}
              className="text-content-subtle hover:text-content-base transition-colors p-1 rounded-full hover:bg-surface-highlight"
              aria-label="Close"
            >
              <IconX size={20} />
            </button>
          </div>
        )}

        <div className={contentPadding}>{children}</div>
      </div>
    </div>
  );

  // Use a portal to render the modal at the end of the document body
  return createPortal(modalContent, document.body);
}

export default Modal;
