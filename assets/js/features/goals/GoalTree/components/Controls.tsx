import * as React from "react";

import { FilledButton } from "@/components/Buttons";
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
      <FilledButton type="secondary" size="xs" onClick={expandAll}>
        Expand All
      </FilledButton>
    );
  } else {
    return (
      <FilledButton type="secondary" size="xs" onClick={collapseAll}>
        Collapse All
      </FilledButton>
    );
  }
}

function ShowHideCompletedToggle() {
  const { showCompleted, setShowCompleted } = useTreeContext();

  const toggle = () => setShowCompleted(!showCompleted);
  const title = showCompleted ? "Hide Completed" : "Show Completed";

  return (
    <FilledButton type="secondary" size="xs" onClick={toggle}>
      {title}
    </FilledButton>
  );
}
