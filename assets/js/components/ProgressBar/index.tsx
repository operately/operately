import React from "react";
import classNames from "classnames";

export function ProgressBar({ percentage, className }: { percentage: number; className?: string }) {
  className = classNames("w-24 h-2.5 bg-surface-outline rounded relative", className || "");

  return (
    <div className={className}>
      <div className="bg-accent-1 rounded absolute top-0 bottom-0 left-0" style={{ width: `${percentage}%` }} />
    </div>
  );
}
