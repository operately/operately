import classNames from "classnames";
import React from "react";

interface TableRowProps {
  children: React.ReactNode;
  topBorder?: boolean;
  bottomBorder?: boolean;
  className?: string;
}

export function TableRow({ children, topBorder = false, bottomBorder = true, className = "" }: TableRowProps) {
  const classname = classNames(
    "flex items-center justify-between",
    "py-2",
    "border-dashed border-stroke-base",
    "hover:bg-surface-highlight",
    {
      "border-b": bottomBorder,
      "border-t": topBorder,
    },
    className,
  );

  return <div className={classname}>{children}</div>;
}
