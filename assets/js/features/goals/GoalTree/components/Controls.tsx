import * as React from "react";

import { GhostButton } from "@/components/Buttons";
import { useTreeContext } from "../treeContext";
import { useExpandable } from "../context/Expandable";

export function Controls() {
  return (
    <div className="flex mb-4 items-center gap-2">
      <ExpandCollapseButton />
      <ShowHideCompletedToggle />
    </div>
  );
}

function ExpandCollapseButton() {
  const { expanded, expandAll, collapseAll } = useExpandable();

  if (Object.keys(expanded).length === 0) {
    return (
      <GhostButton type="secondary" size="xs" onClick={expandAll}>
        Expand All
      </GhostButton>
    );
  } else {
    return (
      <GhostButton type="secondary" size="xs" onClick={collapseAll}>
        Collapse All
      </GhostButton>
    );
  }
}

function ShowHideCompletedToggle() {
  const { showCompleted, setShowCompleted } = useTreeContext();

  const toggle = () => setShowCompleted(!showCompleted);
  const title = showCompleted ? "Hide Completed" : "Show Completed";

  return (
    <GhostButton type="secondary" size="xs" onClick={toggle}>
      {title}
    </GhostButton>
  );
}
