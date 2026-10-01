import { useEmbedding } from "../Embedding";
import React from "react";
type WindowSizeBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";

export function useWindowSizeBreakpoints() {
  const embedding = useEmbedding();
  const container = embedding?.portalContainer;
  const [size, setSize] = React.useState<WindowSizeBreakpoint>(() => getWindowSizeBreakpoint(container?.clientWidth));

  React.useEffect(() => {
    const handleResize = () => setSize(getWindowSizeBreakpoint(container?.clientWidth));
    if (container && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(handleResize);
      observer.observe(container);
      handleResize();
      return () => observer.disconnect();
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [container]);

  return size;
}

function getWindowSizeBreakpoint(width = window.innerWidth): WindowSizeBreakpoint {
  if (width < 640) return "xs";
  if (width < 768) return "sm";
  if (width < 1024) return "md";
  if (width < 1280) return "lg";

  return "xl";
}

const order: WindowSizeBreakpoint[] = ["xs", "sm", "md", "lg", "xl"];

export function useWindowSizeBiggerOrEqualTo(breakpoint: WindowSizeBreakpoint): boolean {
  const size = useWindowSizeBreakpoints();
  return order.indexOf(size) >= order.indexOf(breakpoint);
}
