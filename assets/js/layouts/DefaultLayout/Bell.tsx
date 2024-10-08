import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

import * as Notifications from "@/models/notifications";

export function Bell() {
  const count = Notifications.useUnreadCount();

  return (
    <DivLink
      to={Paths.notificationsPath()}
      className="flex items-center justify-center cursor-pointer relative group rounded-full bg-surface-accent border border-surface-outline"
      style={{ height: "32px", width: "32px" }}
      testId="notifications-bell"
    >
      <Icons.IconBell
        size={20}
        stroke={1.5}
        className="text-content-dimmed group-hover:text-content-accent transition-all"
      />
      <UnreadIndicator count={count} />
    </DivLink>
  );
}

function UnreadIndicator({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div
      className="absolute -top-1 -right-1 rounded-full bg-orange-600 flex items-center justify-center text-white-1 leading-none group-hover:bg-orange-500 transition-all"
      style={{
        height: "17px",
        width: "17px",
        fontSize: "9px",
        fontWeight: "900",
      }}
      data-test-id="unread-notifications-count"
    >
      {count}
    </div>
  );
}
