import React from "react";
import classNames from "classnames";
import { COLORS } from "./constants";
import { COLORS as STATUS_COLORS } from "../status/constants";

interface Props {
  percentage: number;
  className?: string;
  status?: string;
}

export function ProgressBar({ percentage, className, status }: Props) {
  className = classNames("w-24 h-2.5 bg-surface-outline rounded relative", className || "");
  const color = status && STATUS_COLORS[status];

  return (
    <div className={className}>
      <div
        className="bg-accent-1 rounded absolute top-0 bottom-0 left-0"
        style={{
          width: `${percentage}%`,
          backgroundColor: color && COLORS[color],
        }}
      />
    </div>
  );
}
