import * as React from "react";
import classNames from "../utils/classnames";

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  const className = classNames(
    "grid items-center mb-6 pt-5 pb-4 border-b border-stroke-base -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 px-4 sm:px-8",
    actions ? "grid-cols-[auto_minmax(0,1fr)] gap-3" : "grid-cols-1",
    "sm:grid-cols-[30%_minmax(0,1fr)_30%] sm:gap-0",
  );

  return (
    <div className={className}>
      <div className="min-w-0">{actions}</div>
      <div className="min-w-0 text-center">
        <div className="text-balance text-content-accent text-lg md:text-2xl font-extrabold">{title}</div>
      </div>
      <div className="hidden min-w-0 sm:block" />
    </div>
  );
}
