import * as React from "react";

import { DivLink, IconBell } from "turboui";

import * as Notifications from "@/models/notifications";
import classNames from "classnames";

import { usePaths } from "@/routes/paths";
export function Bell() {
  const paths = usePaths();
  const count = Notifications.useUnreadCount();
  const path = paths.notificationsPath();
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
      <UnreadIndicator count={count} />
    </DivLink>
  );
}

function UnreadIndicator({ count }: { count: number }) {
  if (count === 0) return null;

  const className = classNames(
    "absolute -top-1 -right-1",
    "rounded-full",
    "bg-orange-600 text-white-1 group-hover:bg-orange-500",
    "flex items-center justify-center",
    "leading-none",
    "transition-all",
  );

  const style = { height: "17px", width: "17px", fontSize: "9px", fontWeight: "900" };

  return (
    <div className={className} style={style} data-test-id="unread-notifications-count">
      {count}
    </div>
  );
}
