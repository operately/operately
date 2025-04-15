import React from "react";
import classNames from "classnames";
import { IconChevronDown } from "@tabler/icons-react";

interface Props {
  expanded: boolean;
  className?: string;

  onClick: () => void;
}

export function ExpandIcon({ expanded, onClick, className }: Props) {
  className = classNames(className, "mt-2 transition-all", { "rotate-180": expanded });

  return <IconChevronDown size={14} className={className} onClick={onClick} />;
}
