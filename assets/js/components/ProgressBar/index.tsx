import React from "react";
import classNames from "classnames";

interface Props {
  percentage: number;
  className?: string;
  width?: string;
}

export function ProgressBar({ percentage, className, width }: Props) {
  className = classNames("h-2.5 bg-surface-outline rounded relative", className || "", width || "w-24");

  return (
    <div className={className}>
      <div className="bg-accent-1 rounded absolute top-0 bottom-0 left-0" style={{ width: `${percentage}%` }} />
    </div>
  );
}
