import React from "react";

import { IconPlus } from "@tabler/icons-react";
import { useTargetsContext } from "./TargetsContext";

export function AddTargetButton({ display }: { display: boolean }) {
  const { addTarget } = useTargetsContext();

  if (!display) return null;

  return (
    <div
      className="py-2 px-3 border border-surface-outline bg-surface-base rounded cursor-pointer hover:bg-surface-dimmed"
      onClick={addTarget}
      data-test-id="add-target"
    >
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1 text-content-dimmed font-medium">
          <IconPlus size={16} className="text-content-dimmed shrink-0" />
          Add target
        </div>
      </div>
    </div>
  );
}
