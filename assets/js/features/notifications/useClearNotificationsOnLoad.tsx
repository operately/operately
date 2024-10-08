import { useEffect } from "react";
import { useMarkNotificationsAsRead, Notification } from "@/models/notifications";

export function useClearNotificationsOnLoad(notifications: Notification[]) {
  const [markNotificationsAsRead] = useMarkNotificationsAsRead();

  useEffect(() => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id!);

    markNotificationsAsRead({ ids: ids });
  }, []);
}
