import React from "react";

import classNames from "classnames";

export function OpenBadge() {
  return (
    <div className="text-xs border border-green-500 text-green-700 rounded-xl px-2 py-0.5 bg-green-100 font-medium flex items-center shirnk-0 gap-1.5">
      <div className="h-2 w-2 bg-green-700 rounded-full" />
      Open
    </div>
  );
}

export function ClosedBadge() {
  return (
    <div className="text-xs border border-purple-500 text-purple-700 rounded-xl px-2 py-0.5 bg-purple-100 font-medium flex items-center shirnk-0 gap-1.5">
      <div className="h-2 w-2 bg-purple-700 rounded-full" />
      Closed
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    low: "border-gray-500 text-gray-700 bg-gray-100",
    medium: "border-yellow-500 text-yellow-700 bg-yellow-100",
    high: "border-orange-500 text-orange-700 bg-orange-100",
    urgent: "border-red-700 text-red-700 bg-red-100",
  };

  const color = colors[priority] || "border-gray-500 text-gray-700 bg-gray-100";

  const className = classNames(
    "text-xs border rounded-xl px-2 py-0.5 font-medium flex items-center shirnk-0 gap-1.5",
    color,
  );

  const title = priority === "" ? "Unset" : priority;

  const icon = {
    low: <div className="h-2 w-2 bg-gray-700 rounded-full" />,
    medium: <div className="h-2 w-2 bg-yellow-700 rounded-full" />,
    high: <div className="h-2 w-2 bg-orange-700 rounded-full" />,
    urgent: <div className="h-2 w-2 bg-red-700 rounded-full" />,
  };

  return (
    <div className={className}>
      {icon[priority] && icon[priority]}
      <span className="capitalize">{title}</span>
    </div>
  );
}

export function SizeBadge({ size }: { size: string }) {
  const colors = {
    small: "border-gray-500 text-gray-700 bg-gray-100",
    medium: "border-yellow-500 text-yellow-700 bg-yellow-100",
    large: "border-red-700 text-red-700 bg-red-100",
  };

  const color = colors[size] || "border-gray-500 text-gray-700 bg-gray-100";

  const className = classNames(
    "text-xs border rounded-xl px-2 py-0.5 font-medium flex items-center shirnk-0 gap-1.5",
    color,
  );

  const title = size === "" ? "Unset" : size;

  const icon = {
    small: <div className="h-2 w-2 bg-gray-700 rounded-full" />,
    medium: <div className="h-2 w-2 bg-yellow-700 rounded-full" />,
    large: <div className="h-2 w-2 bg-red-700 rounded-full" />,
  };

  return (
    <div className={className}>
      {icon[size] && icon[size]}
      <span className="capitalize">{title}</span>
    </div>
  );
}
