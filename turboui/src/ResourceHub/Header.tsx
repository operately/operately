import * as React from "react";
import classNames from "../utils/classnames";

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  const className = classNames(
    "flex items-center justify-between mb-6 pt-5 pb-4 border-b border-stroke-base -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 px-4 sm:px-8",
  );

  return (
    <div className={className}>
      <div className="w-[30%]">{actions}</div>
      <div className="w-[50%] text-center flex-1">
        <div className="text-content-accent text-lg md:text-2xl font-extrabold">{title}</div>
      </div>
      <div className="w-[30%]" />
    </div>
  );
}
