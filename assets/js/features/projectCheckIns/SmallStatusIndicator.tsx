import * as React from "react";

import classNames from "classnames";

import { COLORS, TITLES, CIRCLE_BACKGROUND_COLORS } from "./constants";

export function SmallStatusIndicator({ status }: { status: string }) {
  const color = COLORS[status];
  const title = TITLES[status];

  const bgColor = CIRCLE_BACKGROUND_COLORS[color];

  const outerClasses = classNames("flex items-center gap-2");
  const innerClasses = classNames("text-sm px-2 py-1 rounded-full h-4 w-4", bgColor);

  return (
    <div className={outerClasses}>
      <div className={innerClasses} />
      <div>{title}</div>
    </div>
  );
}
