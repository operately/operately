import React from "react";
import classnames from "classnames";

export function MenuButton({ children, onClick, title, disabled = false }): JSX.Element {
  let className = classnames("p-1.5 text-content-accent rounded text-xs", {
    "hover:bg-surface-highlight cursor-pointer": !disabled,
    "text-content-subtle": disabled,
  });

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    },
    [onClick],
  );

  return (
    <button onClick={handleClick} className={className} disabled={disabled} title={title}>
      {children}
    </button>
  );
}
