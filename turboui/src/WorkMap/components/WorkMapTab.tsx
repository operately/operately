import React from "react";
import { Link } from "../../Link";
import classNames from "../../utils/classnames";
import { TestableElement } from "../../TestableElement";

interface Props extends TestableElement {
  label: string;
  to?: string;
  onClick?: () => void;
  isActive: boolean;
  icon?: React.ReactNode;
}

/**
 * A tab component for the WorkMap navigation
 */
export function WorkMapTab({ label, to, onClick, isActive, icon, testId }: Props) {
  const className = classNames(
    "border-b-2 px-1 pt-2.5 pb-1 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer",
    isActive
      ? "border-blue-500 text-content-base"
      : "border-transparent text-content-dimmed hover:text-content-base hover:border-surface-accent"
  );

  if (to) {
    return (
      <Link
        to={to}
        className={className}
        aria-current={isActive ? "page" : undefined}
        testId={testId}
      >
        {icon && <span className="h-4 w-4 hidden sm:inline">{icon}</span>}
        {label}
      </Link>
    );
  }

  return (
    <div
      role="tab"
      tabIndex={0}
      className={className}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
      data-testid={testId}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      {icon && <span className="h-4 w-4 hidden sm:inline">{icon}</span>}
      {label}
    </div>
  );
}
