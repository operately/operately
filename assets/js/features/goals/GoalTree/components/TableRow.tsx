import classNames from "classnames";
import React from "react";

interface TableRowProps {
  children: React.ReactNode;
  topBorder?: boolean;
  bottomBorder?: boolean;
}

export function TableRow({ children, topBorder = false, bottomBorder = true }: TableRowProps) {
  const className = classNames(
    "flex items-center justify-between",
    "py-2",
    "border-dashed border-stroke-base -mx-12 px-12",
    "hover:bg-surface-highlight",
    {
      "border-b": bottomBorder,
      "border-t": topBorder,
    },
  );

  return <div className={className}>{children}</div>;
}
