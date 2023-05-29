import React from "react";
import Icon from "../Icon";

export interface TabProps {
  title: string;
  path: string;
  active: boolean;
  icon: string;
  element: React.ReactElement;
  onClick: (id: string) => void;
}

export default function Tab(props: TabProps) {
  const activeClass = "text-brand-1 font-medium border-b-2 border-brand-1";
  const inactiveClass =
    "text-dark-1 border-b-2 hover:border-brand-1 border-transparent";

  const className = [
    props.active ? activeClass : inactiveClass,
    "flex items-center gap-[8px]",
    "py-[9px]",
    "cursor-pointer",
  ].join(" ");

  return (
    <div className={className} onClick={() => props.onClick(props.path)}>
      <Icon
        size="small"
        name={props.icon}
        color={props.active ? "brand" : "dark"}
      />
      {props.title}
    </div>
  );
}

Tab.defaultProps = {
  active: false,
  onClick: () => {},
};
