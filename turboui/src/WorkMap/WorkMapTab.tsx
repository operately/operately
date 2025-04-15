import React from "react";
import { Link } from "../Link";
import classNames from "../utils/classnames";

export interface WorkMapTabProps {
  label: string;
  to: string;
  isActive: boolean;
  icon?: React.ReactNode;
}

/**
 * A tab component for the WorkMap navigation
 */
export function WorkMapTab({ 
  label, 
  to, 
  isActive, 
  icon 
}: WorkMapTabProps): React.ReactElement {
  return (
    <Link
      to={to}
      className={classNames(
        "border-b-2 px-1 pt-2.5 pb-1 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 whitespace-nowrap",
        isActive
          ? "border-blue-500 text-content-base"
          : "border-transparent text-content-dimmed hover:text-content-base hover:border-surface-accent"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {icon && (
        <span className="h-4 w-4 hidden sm:inline">
          {icon}
        </span>
      )}
      {label}
    </Link>
  );
}

export default WorkMapTab;