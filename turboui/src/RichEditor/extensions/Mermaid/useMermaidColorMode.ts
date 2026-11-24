import React from "react";

import type { MermaidColorMode } from "./renderMermaidDiagram";

function readColorMode(): MermaidColorMode {
  if (typeof document === "undefined") return "light";

  const darkModeActive =
    document.documentElement.classList.contains("dark") || document.body?.classList.contains("dark");
  return darkModeActive ? "dark" : "light";
}

export function useMermaidColorMode(): MermaidColorMode {
  const [colorMode, setColorMode] = React.useState<MermaidColorMode>(readColorMode);

  React.useEffect(() => {
    const updateColorMode = () => setColorMode(readColorMode());
    const observer = new MutationObserver(updateColorMode);
    const options: MutationObserverInit = { attributes: true, attributeFilter: ["class"] };

    observer.observe(document.documentElement, options);
    observer.observe(document.body, options);
    updateColorMode();

    return () => observer.disconnect();
  }, []);

  return colorMode;
}
