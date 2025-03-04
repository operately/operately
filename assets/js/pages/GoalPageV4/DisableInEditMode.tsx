import * as React from "react";
import { usePageMode } from ".";

export function DisableInEditMode({ children }) {
  const mode = usePageMode();

  return (
    <div
      className="transition-opacity duration-200"
      style={{
        opacity: mode === "edit" ? "10%" : "100%",
        pointerEvents: mode === "edit" ? "none" : "auto",
      }}
    >
      {children}
    </div>
  );
}
