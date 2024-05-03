import * as Pages from "@/components/Pages";

import client from "@/graphql/client";
import { gql, useSubscription } from "@apollo/client";
import { Notification, ListNotificationsDocument } from "@/gql";

interface LoaderResult {
  notifications: Notification[];
}

export async function loader(): Promise<LoaderResult> {
  const data = await client.query({
    query: ListNotificationsDocument,
    fetchPolicy: "network-only",
    variables: {
      page: 1,
      perPage: 100,
    },
  });

  return {
    notifications: data.data.notifications as Notification[],
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
