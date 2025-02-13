import React from "react";

import classnames from "classnames";
import { createTestId } from "@/utils/testid";

export function ToolbarToggleButton({ children, isActive, title, onClick }): JSX.Element {
  let className = classnames("p-1.5 text-content-accent", {
    "bg-toggle-active": isActive,
    "hover:bg-surface-highlight cursor-pointer": !isActive,
  });

  const testId = createTestId("toolbar-button", title);

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    },
    [onClick],
  );

  return (
    <button onClick={handleClick} className={className} title={title} data-test-id={testId}>
      {children}
    </button>
  );
}
