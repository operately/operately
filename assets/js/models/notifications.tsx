import { gql, useQuery, useSubscription } from "@apollo/client";

export function useUnreadCount() {
  const query = gql`
    query UnreadCount {
      unreadNotificationsCount
    }
  `;

  const subscription = gql`
    subscription NotificationsChanged {
      onUnreadNotificationCountChanged
    }
  `;

  const { data, loading, error, refetch } = useQuery(query, { fetchPolicy: "network-only" });

  useSubscription(subscription, { onData: refetch });

  if (loading) return 0;

  if (error) {
    console.error(error);
    return 0;
  }

  return data.unreadNotificationsCount;
}
