import Api from "@/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNotificationRefreshSignal, useUnreadNotificationCount } from "@/signals";
import { invalidateNotificationQueries } from "./notificationLifecycle";

export function useUnreadCount() {
  const client = useQueryClient();
  const { data } = useQuery(Api.notifications.getUnreadCountQueryOptions({}));
  const refresh = useCallback(() => {
    void invalidateNotificationQueries(client);
  }, [client]);

  // Also invalidate the list while the notifications page is unmounted.
  useUnreadNotificationCount(refresh);
  useNotificationRefreshSignal(refresh);

  return data?.unread ?? 0;
}
