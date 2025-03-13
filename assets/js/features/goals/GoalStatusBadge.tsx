import * as React from "react";

import classNames from "classnames";
import { statusBGColorClass } from "@/components/status/colors";
import { assertGoalStatusValidity } from "@/models/goals";

interface Props {
  status: string;
  className?: string;
  size?: "xs" | "base";
}

const sizeClass = {
  xs: "px-1.5 py-0.5 text-[10px]",
  base: "px-2 py-1 text-xs",
};

export function GoalStatusBadge({ status, className = "", size = "base" }: Props) {
  assertGoalStatusValidity(status);

  const statusClass = classNames(
    statusBGColorClass(status),
    sizeClass[size],
    "rounded-full uppercase font-semibold text-black",
    "whitespace-nowrap",
    className,
  );

  const text = status.replace("_", " ");

  return <div className={statusClass}>{text}</div>;
}
