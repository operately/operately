import { useLayoutEffect, useRef, useState } from "react";

interface UsePopoverPositioningOptions {
  open: boolean;
}

type PopoverSide = "top" | "bottom" | "left" | "right";

export function usePopoverPositioning({ open }: UsePopoverPositioningOptions) {
  const [side, setSide] = useState<PopoverSide>("bottom");
  const [useSidePositioning, setUseSidePositioning] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Check viewport and choose best side dynamically (mobile-friendly)
  useLayoutEffect(() => {
    const checkViewportSize = () => {
      if (typeof window === "undefined") return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const triggerElement = triggerRef.current;
      if (!triggerElement || !open) return;

      const triggerRect = triggerElement.getBoundingClientRect();
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewportWidth - triggerRect.right;

      // Approximate popover size (calendar + actions)
      const POPOVER_HEIGHT = 470; // px
      const POPOVER_WIDTH = 300; // px

      // Prefer bottom, then top; if neither fits, use the side with more space
      if (spaceBelow >= POPOVER_HEIGHT) {
        setSide("bottom");
        setUseSidePositioning(false);
      } else if (spaceAbove >= POPOVER_HEIGHT) {
        setSide("top");
        setUseSidePositioning(false);
      } else if (spaceRight >= POPOVER_WIDTH || spaceLeft >= POPOVER_WIDTH) {
        const sideChoice: PopoverSide = spaceRight >= spaceLeft ? "right" : "left";
        setSide(sideChoice);
        setUseSidePositioning(true);
      } else {
        // Default to bottom with collision handling if nothing fits fully
        setSide("bottom");
        setUseSidePositioning(false);
      }
    };

    if (open) {
      checkViewportSize();
      window.addEventListener("resize", checkViewportSize);
      window.addEventListener("scroll", checkViewportSize, { passive: true });
      return () => {
        window.removeEventListener("resize", checkViewportSize);
        window.removeEventListener("scroll", checkViewportSize);
      };
    }

    return undefined;
  }, [open]);

  return {
    useSidePositioning,
    triggerRef,
    side,
  };
}
