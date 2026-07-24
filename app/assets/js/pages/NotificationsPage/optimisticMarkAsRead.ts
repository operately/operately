import type { Notification } from "@/api";
import type { Dispatch, SetStateAction } from "react";
import { showErrorToast } from "turboui";

export type SetNotifications = Dispatch<SetStateAction<Notification[]>>;
type MarkNotificationAsRead = () => Promise<unknown>;

export async function optimisticallyMarkNotificationAsRead(
  notification: Notification,
  setNotifications: SetNotifications,
  markNotificationAsRead: MarkNotificationAsRead,
): Promise<void> {
  updateNotificationReadState(setNotifications, notification.id, true);

  try {
    await markNotificationAsRead();
  } catch {
    restoreNotificationReadState(setNotifications, notification);
    showErrorToast("Couldn't mark notification as read", "The notification is still unread. Try again.");
  }
}

function updateNotificationReadState(setNotifications: SetNotifications, notificationId: string, read: boolean) {
  setNotifications((notifications) =>
    notifications.map((notification) =>
      notification.id === notificationId ? { ...notification, read } : notification,
    ),
  );
}

function restoreNotificationReadState(setNotifications: SetNotifications, previousNotification: Notification) {
  setNotifications((notifications) =>
    notifications.map((notification) =>
      notification.id === previousNotification.id
        ? {
            ...notification,
            read: previousNotification.read,
            readAt: previousNotification.readAt,
          }
        : notification,
    ),
  );
}
