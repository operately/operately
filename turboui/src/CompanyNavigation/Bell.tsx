import React from "react";

import { DivLink } from "../Link";
import { IconBell } from "../icons";
import classNames from "../utils/classnames";
import { CountBadge } from "./CountBadge";

export function Bell({ path, unreadCount }: { path: string; unreadCount: number }) {
  const style = { height: "32px", width: "32px" };

  const className = classNames(
    "flex items-center justify-center",
    "cursor-pointer",
    "relative group",
    "rounded-full",
    "bg-surface-accent",
    "border border-surface-outline",
  );

  const iconClassName = classNames("text-content-dimmed", "group-hover:text-content-accent transition-all");

  return (
    <DivLink to={path} className={className} style={style} testId="notifications-bell">
      <IconBell size={20} stroke={1.5} className={iconClassName} />
      <CountBadge count={unreadCount} rightOffset={1} testId="unread-notifications-count" />
    </DivLink>
  );
}
