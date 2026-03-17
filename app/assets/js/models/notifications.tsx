import React from "react";
import Api from "@/api";

import { useNotificationRefreshSignal, useUnreadNotificationCount } from "@/signals";

export type { SubscriptionList, Subscription, Subscriber, Notification } from "@/api";

export const useSubscribeToNotifications = Api.notifications.useSubscribe;
export const useUnsubscribeFromNotifications = Api.notifications.useUnsubscribe;
export const useEditSubscriptionsList = Api.notifications.useEditSubscriptionsList;
export const useMarkAllNotificationsAsRead = Api.notifications.useMarkAllAsRead;
export const useMarkNotificationAsRead = Api.notifications.useMarkAsRead;
export const useMarkNotificationsAsRead = Api.notifications.useMarkManyAsRead;

export function useUnreadCount() {
  const [unread, setUnread] = React.useState(0);

  const fetch = React.useCallback(() => {
    Api.notifications.getUnreadCount({}).then((data) => {
      setUnread(data.unread!);
    });
  }, []);

  React.useEffect(() => fetch(), []);
  useUnreadNotificationCount(fetch);
  useNotificationRefreshSignal(fetch);

  return unread;
}
