import { useEmbedding, portalRect } from "../../Embedding";
import { useLayoutEffect, useRef, useState } from "react";

interface UsePopoverPositioningOptions {
  open: boolean;
}

type PopoverSide = "top" | "bottom" | "left" | "right";

export function usePopoverPositioning({ open }: UsePopoverPositioningOptions) {
  const embedding = useEmbedding();
  const container = embedding?.portalContainer;
  const [side, setSide] = useState<PopoverSide>("bottom");
  const [useSidePositioning, setUseSidePositioning] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Check viewport and choose best side dynamically (mobile-friendly)
  useLayoutEffect(() => {
    const checkViewportSize = () => {
      if (typeof window === "undefined") return;

      const viewportWidth = container?.clientWidth ?? window.innerWidth;
      const viewportHeight = container?.clientHeight ?? window.innerHeight;
      const triggerElement = triggerRef.current;
      if (!triggerElement || !open) return;

      const bounds = triggerElement.getBoundingClientRect();
      const position = portalRect(bounds, container);
      const triggerRect = {
        left: position.left,
        top: position.top,
        right: position.left + (position.width ?? 0),
        bottom: position.top + (position.height ?? 0),
      };
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
      const observer =
        container && typeof ResizeObserver !== "undefined" ? new ResizeObserver(checkViewportSize) : null;
      if (container) observer?.observe(container);
      const scrollTarget = embedding?.scrollContainer ?? window;
      window.addEventListener("resize", checkViewportSize);
      scrollTarget.addEventListener("scroll", checkViewportSize, { passive: true });
      return () => {
        window.removeEventListener("resize", checkViewportSize);
        scrollTarget.removeEventListener("scroll", checkViewportSize);
        observer?.disconnect();
      };
    }

    return undefined;
  }, [open, container, embedding?.scrollContainer]);

  return {
    useSidePositioning,
    triggerRef,
    side,
  };
}
