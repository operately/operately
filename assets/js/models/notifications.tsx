import React from "react";
import Api from "@/api";

import { useUnreadNotificationCount } from "@/api/socket";

export function useUnreadCount() {
  const [unread, setUnread] = React.useState(0);

  const fetch = () => {
    Api.getUnreadNotificationCount({}).then((data) => {
      setUnread(data.unread!);
    });
  };

  React.useEffect(() => fetch(), []);
  useUnreadNotificationCount(fetch);

  return unread;
}

export const useMarkAllNotificationsAsRead = Api.useMarkAllNotificationsAsRead;
export const useMarkNotificationAsRead = Api.useMarkNotificationAsRead;
