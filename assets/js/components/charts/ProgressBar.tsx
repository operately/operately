import React from "react";
import classNames from "classnames";
import { COLORS } from "./constants";
import { COLORS as STATUS_COLORS } from "../status/constants";

interface Props {
  percentage: number;
  className?: string;
  status?: string;
  width?: string;
}

export function ProgressBar({ percentage, className, status, width }: Props) {
  className = classNames("h-2 bg-stone-300 relative rounded-sm", className || "", width || "w-24");
  const color = status && STATUS_COLORS[status];

  return (
    <div className={className}>
      <div
        className="bg-accent-1 absolute top-0 bottom-0 left-0 rounded-sm"
        style={{
          width: `${percentage}%`,
          backgroundColor: color && COLORS[color],
        }}
      />
    </div>
  );
}
