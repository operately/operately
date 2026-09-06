import React from "react";

import { OperatelyLogo } from "../Logo";
import { NotificationRow, type NotificationRowProps } from ".";

const OPERATELY_AUTHOR = { fullName: "Operately" };

export type OperatelyNotificationRowProps = Omit<NotificationRowProps, "author" | "authorAvatar" | "location">;

export function OperatelyNotificationRow(props: OperatelyNotificationRowProps) {
  return (
    <NotificationRow
      {...props}
      author={OPERATELY_AUTHOR}
      authorAvatar={<OperatelyLogo size="32px" aria-hidden data-test-id="operately-notification-logo" />}
    />
  );
}
