import { createTestId } from "@/utils/testid";
import classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";

export function OptionsMenu({ children }) {
  return (
    <div className="bg-surface-dimmed rounded-lg overflow-hidden divide-y divide-surface-outline border border-surface-outline">
      {children}
    </div>
  );
}

export function OptionsMenuItem({ icon, title, linkTo, disabled }) {
  const testId = createTestId(title);

  const className = classNames("flex items-center gap-4 group px-4 py-3", {
    "font-bold text-content text-lg": !disabled,
    "font-medium text-lg": disabled,
  });

  if (disabled) {
    return (
      <div className={className}>
        {React.createElement(icon, { size: 20 })}
        {title}
      </div>
    );
  } else {
    return (
      <Link to={linkTo} className={className} data-test-id={testId}>
        {React.createElement(icon, { size: 24 })}
        {title}
      </Link>
    );
  }
}
