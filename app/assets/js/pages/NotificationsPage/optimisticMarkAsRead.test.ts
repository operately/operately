import type { Notification } from "@/api";
import { showErrorToast } from "turboui";
import { optimisticallyMarkNotificationAsRead, type SetNotifications } from "./optimisticMarkAsRead";

jest.mock("turboui", () => ({
  showErrorToast: jest.fn(),
}));

function notification(id: string, read = false): Notification {
  return {
    __typename: "notification",
    id,
    read,
    readAt: read ? "2026-07-23T12:00:00Z" : null,
    insertedAt: "2026-07-23T12:00:00Z",
  };
}

function notificationStore(initialNotifications: Notification[]) {
  let notifications = initialNotifications;

  const setNotifications: SetNotifications = (update) => {
    notifications = typeof update === "function" ? update(notifications) : update;
  };

  return {
    get notifications() {
      return notifications;
    },
    setNotifications,
  };
}

function deferredPromise() {
  const controls: {
    resolve: () => void;
    reject: (reason?: unknown) => void;
  } = {
    resolve: () => {},
    reject: () => {},
  };

  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    controls.resolve = resolvePromise;
    controls.reject = rejectPromise;
  });

  return { promise, ...controls };
}

describe("optimisticallyMarkNotificationAsRead", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates the notification before the API request completes", async () => {
    const unreadNotification = notification("notification-1");
    const store = notificationStore([unreadNotification]);
    const request = deferredPromise();

    const result = optimisticallyMarkNotificationAsRead(
      unreadNotification,
      store.setNotifications,
      () => request.promise,
    );

    expect(store.notifications[0]?.read).toBe(true);

    request.resolve();
    await result;

    expect(store.notifications[0]?.read).toBe(true);
  });

  it("restores only the failed notification and shows an error toast", async () => {
    const failedNotification = notification("notification-1");
    const store = notificationStore([failedNotification, notification("notification-2")]);
    const request = deferredPromise();

    const result = optimisticallyMarkNotificationAsRead(
      failedNotification,
      store.setNotifications,
      () => request.promise,
    );

    store.setNotifications((notifications) =>
      notifications.map((item) => (item.id === "notification-2" ? { ...item, read: true } : item)),
    );

    request.reject(new Error("Network error"));
    await result;

    expect(store.notifications).toEqual([
      notification("notification-1"),
      expect.objectContaining({ id: "notification-2", read: true }),
    ]);
    expect(showErrorToast).toHaveBeenCalledWith(
      "Couldn't mark notification as read",
      "The notification is still unread. Try again.",
    );
  });
});
