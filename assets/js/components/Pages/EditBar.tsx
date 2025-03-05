import React from "react";

import { SecondaryButton, PrimaryButton } from "@/components/Buttons";
import { useIsViewMode } from "./Page";

interface EditBarProps {
  save: () => void;
  cancel: () => void;
}

export function EditBar({ save, cancel }: EditBarProps) {
  const isViewMode = useIsViewMode();

  if (isViewMode) {
    return null;
  }

  return (
    <div className="fixed z-50 top-20 -translate-x-1/2 left-1/2 bg-surface-base px-6 py-4 rounded-full shadow-lg border-2 border-accent-1">
      <div className="flex items-center justify-between gap-10">
        <div className="">Click on the content to edit</div>
        <div className="flex gap-2 items-center">
          <SecondaryButton size="sm" onClick={cancel}>
            Discard Changes
          </SecondaryButton>
          <PrimaryButton size="sm" onClick={save}>
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
