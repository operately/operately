/**
 * ActionList Component
 *
 * A component for rendering a list of clickable actions with icons.
 * Typically used in sidebars to provide a set of actions for a resource.
 *
 * Features:
 * - Icon alignment with section titles
 * - Support for both links and action buttons
 * - Support for "danger" items (shown in red)
 * - Hover highlight that only covers the content area, not the full width
 * - Hidden items that aren't rendered
 */
import React from "react";
import { DivLink } from "../Link";

import classNames from "../utils/classnames";

namespace ActionList {
  export interface Item {
    type: "link" | "action";
    label: string;
    link?: string;
    onClick?: () => void;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
    hidden?: boolean;
    danger?: boolean;
  }
}

export function ActionList({ actions }: { actions: ActionList.Item[] }) {
  const visibleItems = actions.filter((option) => !option.hidden);

  return (
    <div className="space-y-0.5 flex flex-col">
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
    "cursor-pointer rounded",
    "transition-colors duration-150",
    "-ml-1 pl-1 pr-2", // Negative left margin to align icon with title text
    "w-fit", // Set width to fit content, ensuring hover only covers the content area
    "max-w-full", // Ensure it doesn't overflow its container
    {
      // Danger styling
      "text-red-600 hover:text-red-700 hover:bg-red-50": item.danger,
      // Normal styling
      "hover:text-content-base hover:bg-surface-dimmed": !item.danger,
    },
  );

  if (item.type === "link" && item.link) {
    return (
      <DivLink to={item.link} className={className}>
        <Icon size={16} className="shrink-0" />
        <span>{item.label}</span>
      </DivLink>
    );
  }

  if (item.type === "action" && item.onClick) {
    return (
      <div onClick={item.onClick} className={className}>
        <Icon size={16} className="shrink-0" />
        <span>{item.label}</span>
      </div>
    );
  }

  throw new Error("Invalid action option provided");
}
