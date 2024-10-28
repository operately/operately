import { createTestId } from "@/utils/testid";
import classNames from "classnames";
import * as React from "react";
import { BlackLink } from "@/components/Link";

export function OptionsMenuItem({ icon, title, linkTo, disabled }) {
  const testId = createTestId(title);

  const className = classNames(
    "flex items-center gap-4 group py-3 font-medium",
    "border-t border-stroke-base",
    "last:border-b",
  );

  return (
    <div className={className}>
      {React.createElement(icon, { size: 18 })}

      {disabled ? (
        <span>{title}</span>
      ) : (
        <BlackLink to={linkTo} testId={testId} underline="hover" className="font-semibold">
          {title}
        </BlackLink>
      )}
    </div>
  );
}
