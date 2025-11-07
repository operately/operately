import React from "react";
import classNames from "classnames";
import { IconChevronDown } from "turboui";

interface Props {
  expanded: boolean;
  className?: string;
}

export function ExpandIcon({ expanded, className }: Props) {
  className = classNames(className, "mt-2 transition-all", { "rotate-180": expanded });

  return <IconChevronDown size={14} className={className} />;
}
