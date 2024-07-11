import React from "react";
import Api from "@/api";

export function useUnreadCount() {
  const [unread, setUnread] = React.useState(0);

  const fetch = () => {
    Api.getUnreadNotificationCount({}).then((data) => {
      setUnread(data.unread!);
    });
  };

  // const subscription = gql`
  //   subscription NotificationsChanged {
  //     onUnreadNotificationCountChanged
  //   }
  // `;

  // useSubscription(subscription, { onData: () => fetch() });
  React.useEffect(() => fetch(), []);

  return unread;
}

export const useMarkAllNotificationsAsRead = Api.useMarkAllNotificationsAsRead;
export const useMarkNotificationAsRead = Api.useMarkNotificationAsRead;
