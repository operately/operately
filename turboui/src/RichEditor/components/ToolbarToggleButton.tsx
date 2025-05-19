import React from "react";

import classNames from "classnames";
import { createTestId } from "../../TestableElement";

export function ToolbarToggleButton({ children, isActive, title, onClick }): JSX.Element {
  let className = classNames("p-1.5 text-content-accent", {
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
    <button onClick={handleClick} className={className} title={title} data-test-id={testId} tabIndex={-1}>
      {children}
    </button>
  );
}
