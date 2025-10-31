import React from "react";
import classNames from "../utils/classnames";

export function Paper({ children, testId }: { children: React.ReactNode; testId?: string }) {
  const classname = classNames(
    "relative",
    "bg-surface-base",

    // full height on mobile, no min height on larger screens
    "min-h-dvh sm:min-h-0",

    // apply border shadow and rounded corners on larger screens
    "sm:border sm:border-surface-outline",

    "sm:rounded-lg",
    "sm:shadow-xl",

    "sm:mx-4"
  );

  return (
    <div className={classname} data-test-id={testId}>
      {children}
    </div>
  );
}
