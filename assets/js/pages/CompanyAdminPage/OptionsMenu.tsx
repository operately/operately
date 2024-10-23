import { createTestId } from "@/utils/testid";
import classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";

export function OptionsMenu({ children }) {
  return <div className="divide-y divide-stroke-base border-y border-stroke-base">{children}</div>;
}

export function OptionsMenuItem({ icon, title, linkTo, disabled }) {
  const testId = createTestId(title);

  const className = classNames("flex items-center gap-4 group py-3", {
    "font-bold text-content": !disabled,
    "font-medium": disabled,
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
        {React.createElement(icon, { size: 20 })}
        {title}
      </Link>
    );
  }
}
