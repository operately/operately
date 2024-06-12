import React from "react";
import Api from "@/api";
import { gql, useMutation, useSubscription } from "@apollo/client";

export function useUnreadCount() {
  const [unread, setUnread] = React.useState(0);

  const fetch = () => {
    Api.getUnreadNotificationCount({}).then((data) => {
      setUnread(data.unread);
    });
  };

  const subscription = gql`
    subscription NotificationsChanged {
      onUnreadNotificationCountChanged
    }
  `;

  useSubscription(subscription, { onData: () => fetch() });
  React.useEffect(() => fetch(), []);

  return unread;
}

export function useMarkAllNotificationsRead() {
  const query = gql`
    mutation MarkAllNotificationsAsRead {
      markAllNotificationsAsRead
    }
  `;

  return useMutation(query);
}
