import * as React from "react";

type WindowSizeBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";

export function useWindowSizeBreakpoints() {
  const [size, setSize] = React.useState<WindowSizeBreakpoint>(getWindowSizeBreakpoint());

  React.useEffect(() => {
    const handleResize = () => setSize(getWindowSizeBreakpoint());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

function getWindowSizeBreakpoint(): WindowSizeBreakpoint {
  if (window.innerWidth < 640) return "xs";
  if (window.innerWidth < 768) return "sm";
  if (window.innerWidth < 1024) return "md";
  if (window.innerWidth < 1280) return "lg";

  return "xl";
}
