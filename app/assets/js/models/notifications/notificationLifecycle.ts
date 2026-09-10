import Api, { type Notification } from "@/api";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { LocalSignal, publish } from "@/signals";

type InvalidateResourceQueries = (client: QueryClient) => Promise<void>;

export function useReadNotifications(invalidateResourceQueries?: InvalidateResourceQueries) {
  const client = useQueryClient();
  const read = useMutation({
    ...Api.notifications.markManyAsReadMutationOptions(),
    onMutate: () => ({ invalidateResourceQueries }),
    onSuccess: async (_result, _input, saved: { invalidateResourceQueries?: InvalidateResourceQueries }) => {
      publish(LocalSignal.RefreshNotificationCount);
      await Promise.all([
        saved?.invalidateResourceQueries?.(client),
        client.invalidateQueries({ queryKey: Api.notifications.listQueryKeyPrefix() }),
        client.invalidateQueries({ queryKey: Api.notifications.getUnreadCountQueryKeyPrefix() }),
      ]);
    },
  });

  const requested = useRef(new Set<string>());
  const { mutateAsync } = read;

  return useCallback(
    async (notifications: Notification[]) => {
      const ids = [
        ...new Set(notifications.filter((n) => n.id && !n.read && !requested.current.has(n.id)).map((n) => n.id)),
      ];
      if (!ids.length) return;
      ids.forEach((id) => requested.current.add(id));
      try {
        await mutateAsync({ ids });
      } catch (error) {
        ids.forEach((id) => requested.current.delete(id));
        throw error;
      }
    },
    [mutateAsync],
  );
}

export function useReadNotificationsOnLoad(
  notifications: Notification[],
  invalidateResourceQueries?: InvalidateResourceQueries,
) {
  const read = useReadNotifications(invalidateResourceQueries);
  useEffect(() => {
    void read(notifications).catch((error) => console.error("Failed to mark notifications as read", error));
  }, [notifications, read]);
}
