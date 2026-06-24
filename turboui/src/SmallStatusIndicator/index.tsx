import React from "react";
import classNames from "../utils/classnames";
import { CIRCLE_BACKGROUND_COLORS, COLORS, SmallStatusIndicatorStatus, TITLES } from "./constants";

type Size = "std" | "sm";

interface SmallStatusIndicatorProps {
  status: string;
  size?: Size;
  textClassName?: string;
  hideText?: boolean;
}

export function SmallStatusIndicator({ status, size, textClassName = "", hideText }: SmallStatusIndicatorProps) {
  if (!isSmallStatusIndicatorStatus(status)) {
    return null;
  }

  const color = COLORS[status];
  const title = TITLES[status];
  const backgroundColor = CIRCLE_BACKGROUND_COLORS[color];
  const contentSize = size === "sm" ? "text-xs h-3 w-3" : "text-sm h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-1.5">
      <div className={classNames("py-1 rounded-full", contentSize, backgroundColor)} />
      <div className={classNames(textSize, textClassName, { hidden: hideText })}>{title}</div>
    </div>
  );
}

function isSmallStatusIndicatorStatus(status: string): status is SmallStatusIndicatorStatus {
  return status in TITLES;
}

export { COLORS, TITLES, CIRCLE_BORDER_COLORS, CIRCLE_BACKGROUND_COLORS } from "./constants";
export type { SmallStatusIndicatorStatus };
