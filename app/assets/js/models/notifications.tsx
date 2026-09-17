import Api from "@/api";

export type { SubscriptionList, Subscription, Subscriber, Notification } from "@/api";
export { useUnreadCount } from "./notifications/useUnreadCount";
export { useMarkNotificationRead, useMarkAllNotificationsRead } from "./notifications/notificationLifecycle";

export const useMarkNotificationAsRead = Api.notifications.useMarkAsRead;
export const useMarkNotificationsAsRead = Api.notifications.useMarkManyAsRead;
