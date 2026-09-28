import classNames from "classnames";
import React from "react";
import { createTestId } from "../../TestableElement";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string;
};

export const ToolbarButton = React.forwardRef<HTMLButtonElement, Props>(function ToolbarButton(
  { children, onClick, title, disabled = false, tabIndex = -1, className: extraClassName, ...props },
  ref,
) {
  const className = classNames(
    "p-1.5 text-content-accent rounded text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-1",
    extraClassName,
    {
      "hover:bg-surface-highlight cursor-pointer": !disabled,
      "text-content-subtle": disabled,
    },
  );

  const testId = createTestId("toolbar-button", title);

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClick?.(e);
      e.preventDefault();
    },
    [onClick],
  );

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      onClick={handleClick}
      className={className}
      disabled={disabled}
      title={title}
      data-test-id={testId}
      tabIndex={tabIndex}
    >
      {children}
    </button>
  );
});
