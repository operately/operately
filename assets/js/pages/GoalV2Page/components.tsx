import * as React from "react";
import { useIsEditMode } from "@/components/Pages";

export function DisableInEditMode({ children }) {
  const editMode = useIsEditMode();

  return (
    <div
      className="transition-opacity duration-200"
      style={{
        opacity: editMode ? "10%" : "100%",
        pointerEvents: editMode ? "none" : "auto",
      }}
    >
      {children}
    </div>
  );
}

export function Title({ title }: { title: string }) {
  return <div className="my-2 uppercase text-xs font-semibold tracking-wide">{title}</div>;
}

export function HorizontalRule() {
  return <div className="my-6 border-t border-stroke-base" />;
}
