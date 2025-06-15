import React from "react";
import { DivLink } from "../Link";

import classNames from "../utils/classnames";

namespace ActionList {
  export interface Item {
    type: "link" | "action";
    label: string;
    link?: string;
    onClick?: () => void;
    icon: React.ComponentType<{ size?: number | string }>;
    hidden?: boolean;
  }
}

export function ActionList({ actions }: { actions: ActionList.Item[] }) {
  const visibleItems = actions.filter((option) => !option.hidden);

  return (
    <div className="space-y-0.5">
      {visibleItems.map((item, index) => (
        <ActionItem key={index} item={item} />
      ))}
    </div>
  );
}

function ActionItem({ item }: { item: ActionList.Item }) {
  const Icon = item.icon;

  const className = classNames(
    "flex items-center gap-2 py-0.5 text-sm",
    "hover:text-content-base",
    "hover:bg-surface-dimmed cursor-pointer rounded",
    "transition-colors duration-150",
    "-ml-1 pl-1 pr-2", // Negative left margin to align icon with title text
  );

  if (item.type === "link" && item.link) {
    return (
      <DivLink to={item.link} className={className}>
        <Icon size={16} />
        {item.label}
      </DivLink>
    );
  }

  if (item.type === "action" && item.onClick) {
    return (
      <div onClick={item.onClick} className={className}>
        <Icon size={16} />
        {item.label}
      </div>
    );
  }

  throw new Error("Invalid action option provided");
}
