import React from "react";
import Api from "@/api";

import { useUnreadNotificationCount } from "@/signals";

export type { SubscriptionList, Subscription, Subscriber, Notification } from "@/api";
export {
  useSubscribeToNotifications,
  useUnsubscribeFromNotifications,
  useEditSubscriptionsList,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useMarkNotificationsAsRead,
} from "@/api";

export function useUnreadCount() {
  const [unread, setUnread] = React.useState(0);

  const fetch = React.useCallback(() => {
    Api.getUnreadNotificationCount({}).then((data) => {
      setUnread(data.unread!);
    });
  }, []);

  React.useEffect(() => fetch(), []);
  useUnreadNotificationCount(fetch);

  return unread;
}
