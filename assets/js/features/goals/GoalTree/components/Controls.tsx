import * as React from "react";

import { SecondaryButton } from "@/components/Buttons";
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
      <SecondaryButton size="xs" onClick={expandAll}>
        Expand All
      </SecondaryButton>
    );
  } else {
    return (
      <SecondaryButton size="xs" onClick={collapseAll}>
        Collapse All
      </SecondaryButton>
    );
  }
}

function ShowHideCompletedToggle() {
  const { showCompleted, setShowCompleted } = useTreeContext();

  const toggle = () => setShowCompleted(!showCompleted);
  const title = showCompleted ? "Hide Completed" : "Show Completed";

  return (
    <SecondaryButton size="xs" onClick={toggle} testId="show-hide-completed">
      {title}
    </SecondaryButton>
  );
}
