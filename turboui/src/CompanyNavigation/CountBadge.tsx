import React from "react";

import classNames from "../utils/classnames";

const rightOffsetClass = {
  1: "-right-1",
  3: "-right-3",
} as const;

export function CountBadge({
  count,
  rightOffset,
  testId,
}: {
  count: number;
  rightOffset: keyof typeof rightOffsetClass;
  testId: string;
}) {
  if (count === 0) return null;

  const className = classNames(
    "absolute -top-1",
    rightOffsetClass[rightOffset],
    "rounded-full",
    "bg-orange-600 text-white-1 group-hover:bg-orange-500",
    "flex items-center justify-center",
    "leading-none",
    "transition-all",
  );

  const style = { height: "17px", width: "17px", fontSize: "9px", fontWeight: "900" };

  return (
    <div className={className} style={style} data-test-id={testId}>
      {count}
    </div>
  );
}
