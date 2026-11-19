import { useState } from "react";
import type { ColumnColorMode } from "../columnColors";

const STORAGE_KEY = "board:columnColors";

export function useBoardColumnColorMode() {
  const [value, setValue] = useState<ColumnColorMode>(readColumnColorMode);

  const setColumnColorMode = (mode: ColumnColorMode) => {
    setValue(mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Keep the selection for this mount when browser storage is unavailable.
    }
  };

  return [value, setColumnColorMode] as const;
}

function readColumnColorMode(): ColumnColorMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    switch (stored) {
      case "vivid":
      case "soft":
      case "bordered":
      case "none":
        return stored;
    }
  } catch {
    // Use the default when browser storage is unavailable.
  }
  return "soft";
}
