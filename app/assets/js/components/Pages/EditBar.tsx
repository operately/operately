import React from "react";

import { SecondaryButton, PrimaryButton } from "@/components/Buttons";
import { useIsViewMode } from "./Page";
import { useWindowSizeBreakpoints } from "./useWindowSizeBreakpoint";

interface EditBarProps {
  save: () => void;
  cancel: () => void;
}

export function EditBar({ save, cancel }: EditBarProps) {
  const isViewMode = useIsViewMode();
  const size = useWindowSizeBreakpoints();

  if (isViewMode) {
    return null;
  }

  if (size === "xs") {
    return <MobileEditBar save={save} cancel={cancel} />;
  } else {
    return <DesktopEditBar save={save} cancel={cancel} />;
  }
}

function DesktopEditBar({ save, cancel }: EditBarProps) {
  return (
    <div className="fixed z-50 top-16 -translate-x-1/2 left-1/2 bg-surface-base px-6 py-4 rounded-full shadow-lg border-2 border-accent-1">
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

function MobileEditBar({ save, cancel }: EditBarProps) {
  return (
    <div className="fixed z-50 top-0 left-0 right-0 bg-surface-base px-4 py-4 border-b-4 border-accent-1">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm">Click on the content to edit</div>
        <div className="flex gap-2 items-center">
          <SecondaryButton size="sm" onClick={cancel}>
            Discard
          </SecondaryButton>
          <PrimaryButton size="sm" onClick={save}>
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
