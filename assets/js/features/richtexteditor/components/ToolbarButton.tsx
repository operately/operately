import React from "react";
import classnames from "classnames";
import { createTestId } from "@/utils/testid";

export function ToolbarButton({ children, onClick, title, disabled = false }): JSX.Element {
  const className = classnames("p-1.5 text-content-accent rounded text-xs", {
    "hover:bg-surface-highlight cursor-pointer": !disabled,
    "text-content-subtle": disabled,
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
    <button onClick={handleClick} className={className} disabled={disabled} title={title} data-test-id={testId}>
      {children}
    </button>
  );
}
