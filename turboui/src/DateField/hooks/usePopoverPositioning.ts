import { useEffect, useRef, useState } from "react";

interface UsePopoverPositioningOptions {
  open: boolean;
}

export function usePopoverPositioning({ open }: UsePopoverPositioningOptions) {
  const [useSidePositioning, setUseSidePositioning] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Check if viewport is too small for popover positioning
  useEffect(() => {
    const checkViewportSize = () => {
      if (typeof window !== "undefined") {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const triggerElement = triggerRef.current;

        if (triggerElement && open) {
          const triggerRect = triggerElement.getBoundingClientRect();
          const spaceBelow = viewportHeight - triggerRect.bottom;
          const spaceAbove = triggerRect.top;
          const spaceLeft = triggerRect.left;
          const spaceRight = viewportWidth - triggerRect.right;

          // If there's insufficient space above or below, but sufficient space on sides, use side positioning
          const hasVerticalSpace = spaceBelow >= 470 || spaceAbove >= 470;
          const hasHorizontalSpace = spaceLeft >= 320 || spaceRight >= 320;
          const shouldUseSidePositioning = !hasVerticalSpace && hasHorizontalSpace;
          setUseSidePositioning(shouldUseSidePositioning);
        }
      }
    };

    if (open) {
      checkViewportSize();
      window.addEventListener("resize", checkViewportSize);
      return () => window.removeEventListener("resize", checkViewportSize);
    }

    return undefined;
  }, [open]);

  return {
    useSidePositioning,
    triggerRef,
  };
}
