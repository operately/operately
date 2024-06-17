import * as Pages from "@/components/Pages";
import * as Api from "@/api";

import { gql, useSubscription } from "@apollo/client";

interface LoaderResult {
  notifications: Api.Notification[];
}

export async function loader(): Promise<LoaderResult> {
  const data = await Api.getNotifications({
    page: 1,
    perPage: 100,
  });

  return {
    notifications: data.notifications as Api.Notification[],
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData<LoaderResult>();
}

export function useRefresh() {
  return Pages.useRefresh();
}

export function useSubscribeToChanges() {
  const refresh = useRefresh();

  const subscription = gql`
    subscription NotificationsChanged {
      onUnreadNotificationCountChanged
    }
  `;

  useSubscription(subscription, { onData: refresh });
}
