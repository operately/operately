import * as React from "react";

import classNames from "classnames";

import { COLORS, TITLES, CIRCLE_BACKGROUND_COLORS } from "./constants";
import { match } from "ts-pattern";

type Size = "std" | "sm";

interface Props {
  status: string;
  size?: Size;
  textClassName?: string;
  hideText?: boolean;
}

export function SmallStatusIndicator({ status, size, textClassName = "", hideText }: Props) {
  const color = COLORS[status];
  const title = TITLES[status];

  const bgColor = CIRCLE_BACKGROUND_COLORS[color];
  const contentSize = match(size)
    .with("sm", () => "text-xs h-3 w-3")
    .otherwise(() => "text-sm h-4 w-4");
  const textSize = match(size)
    .with("sm", () => "text-xs")
    .otherwise(() => "text-sm");

  const outerClasses = classNames("flex items-center gap-1.5");
  const innerClasses = classNames("py-1 rounded-full", contentSize, bgColor);
  const textClasses = classNames(textSize, textClassName, { hidden: hideText });

  return (
    <div className={outerClasses}>
      <div className={innerClasses} />
      <div className={textClasses}>{title}</div>
    </div>
  );
}
