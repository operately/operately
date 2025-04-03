import React from "react";
import classNames from "classnames";

export function LoadingProgressBar({ progress, barClassName }: { progress: number; barClassName?: string }) {
  const className = classNames(
    "bg-content-accent rounded-xl text-content-accent font-medium h-5 overflow-hidden",
    barClassName || "",
  );

  return (
    <div className={className}>
      <div className="bg-accent-1 h-full" style={{ width: `${progress}%` }}></div>
    </div>
  );
}
