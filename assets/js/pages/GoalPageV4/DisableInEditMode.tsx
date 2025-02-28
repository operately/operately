import * as React from "react";
import * as Pages from "@/components/Pages";

export function DisableInEditMode({ children }) {
  const mode = Pages.useLoadedData()["mode"];

  return (
    <div
      className="transition-opacity duration-200"
      style={{
        opacity: mode === "edit" ? "20%" : "100%",
        pointerEvents: mode === "edit" ? "none" : "auto",
      }}
    >
      {children}
    </div>
  );
}
