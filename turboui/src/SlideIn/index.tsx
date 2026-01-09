import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { IconX } from "../icons";

export { ActionConfirmation } from "./ActionConfirmation";

export interface SlideInProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
  closeOnBackdropClick?: boolean;
  contentClassName?: string;
  header?: React.ReactNode;
  testId?: string;
  showCloseButton?: boolean;
}

export function SlideIn({
  isOpen,
  onClose,
  children,
  width = "60%",
  closeOnBackdropClick = true,
  contentClassName = "",
  header,
  testId,
  showCloseButton = true,
}: SlideInProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideInRef = useRef<HTMLDivElement>(null);

  // Handle mounting and animation
  useEffect(() => {
    if (isOpen) {
      // First mount the component
      setShouldRender(true);

      // Then trigger animation after a brief delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);

      // Disable body scroll when slide-in is open
      document.body.style.overflow = "hidden";

      // Handle ESC key to close the slide-in
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEsc);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEsc);
      };
    } else {
      // Trigger close animation
      setIsAnimating(false);

      // Unmount after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match the transition duration

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  // Handle clicks outside the slide-in
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && slideInRef.current && !slideInRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!shouldRender) {
    return null;
  }

  const slideInContent = (
    <div
      className={`fixed inset-0 z-50 flex justify-end ${
        isAnimating ? "bg-black/30" : "bg-black/0"
      } transition-colors duration-300 ease-in-out`}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      data-test-id={testId}
    >
      <div
        ref={slideInRef}
        className={`relative bg-surface-base shadow-2xl h-full overflow-auto flex flex-col ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out ${contentClassName}`}
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {header && header}

        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 cursor-pointer text-content-dimmed hover:text-content-base rounded-full hover:bg-surface-highlight transition-colors"
            aria-label="Close"
            data-test-id="slide-in-close-button"
            title="Close"
          >
            <IconX size={18} />
          </button>
        )}

        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );

  // Use a portal to render the slide-in at the end of the document body
  return createPortal(slideInContent, document.body);
}

export default SlideIn;
