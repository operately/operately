import React from "react";

export interface TabProps {
  title: string;
  path: string;
  active: boolean;
  icon: (active: boolean) => React.ReactElement;
  element: React.ReactElement;
  onClick: (id: string) => void;
}

const baseClass = [
  "font-bold",
  "border-b-2",
  "flex items-center gap-2",
  "-mb-[1px] px-4 py-4",
  "cursor-pointer",
].join(" ");

const activeClass = ["border-white-2", "text-white-1"].join(" ");

const inactiveClass = [
  "border-transparent",
  "text-white-2",
  "hover:text-white-1",
  "transition-colors",
].join(" ");

export default function Tab(props: TabProps) {
  const active = props.active;
  const className = baseClass + " " + (active ? activeClass : inactiveClass);

  return (
    <div className={className} onClick={() => props.onClick(props.path)}>
      {props.icon(props.active)}
      {props.title}
    </div>
  );
}

Tab.defaultProps = {
  active: false,
  onClick: () => {},
};
