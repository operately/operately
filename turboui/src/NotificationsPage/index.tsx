import * as React from "react";

import type { AvatarPerson } from "../Avatar";
import { SecondaryButton } from "../Button";
import { type FormattedTimePreferences } from "../FormattedTime";
import { IconSparkles } from "../icons";
import { NotificationRow } from "../NotificationRow";
import { OperatelyNotificationRow } from "../NotificationRow/OperatelyNotificationRow";
import { Page } from "../Page";

export namespace NotificationsPage {
  interface BaseNotification {
    id: string;
    read: boolean;
    title: React.ReactNode;
    insertedAt: string;
    testId: string;
  }

  export interface PersonNotification extends BaseNotification {
    type?: "person";
    author: AvatarPerson;
    location: React.ReactNode;
  }

  export interface OperatelyNotification extends BaseNotification {
    type: "operately";
  }

  export type Notification = PersonNotification | OperatelyNotification;

  export interface Props {
    notifications: Notification[];
    formattedTimePreferences: FormattedTimePreferences;
    onOpenNotification: (notification: Notification) => void;
    onMarkNotificationAsRead: (notification: Notification) => void;
    onMarkAllNotificationsAsRead: () => void;
    isMarkingAllNotificationsAsRead?: boolean;
  }
}

export function NotificationsPage({
  notifications,
  formattedTimePreferences,
  onOpenNotification,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  isMarkingAllNotificationsAsRead = false,
}: NotificationsPage.Props) {
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const previousNotifications = notifications.filter((notification) => notification.read);

  return (
    <Page title="Notifications" size="medium" testId="notifications-page">
      <main className="relative flex flex-col items-stretch px-12 py-10">
        <h1 className="text-2xl font-bold text-center">Notifications</h1>
        <p className="text-center text-sm">Here's every notification you've received from Operately.</p>

        <UnreadNotifications
          notifications={unreadNotifications}
          formattedTimePreferences={formattedTimePreferences}
          onOpenNotification={onOpenNotification}
          onMarkNotificationAsRead={onMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
          isMarkingAllNotificationsAsRead={isMarkingAllNotificationsAsRead}
        />
        <PreviousNotifications
          notifications={previousNotifications}
          formattedTimePreferences={formattedTimePreferences}
          onOpenNotification={onOpenNotification}
          onMarkNotificationAsRead={onMarkNotificationAsRead}
        />
      </main>
    </Page>
  );
}

interface NotificationListProps {
  notifications: NotificationsPage.Notification[];
  formattedTimePreferences: FormattedTimePreferences;
  onOpenNotification: NotificationsPage.Props["onOpenNotification"];
  onMarkNotificationAsRead: NotificationsPage.Props["onMarkNotificationAsRead"];
}

interface UnreadNotificationsProps extends NotificationListProps {
  onMarkAllNotificationsAsRead: NotificationsPage.Props["onMarkAllNotificationsAsRead"];
  isMarkingAllNotificationsAsRead: boolean;
}

function UnreadNotifications({
  notifications,
  formattedTimePreferences,
  onOpenNotification,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  isMarkingAllNotificationsAsRead,
}: UnreadNotificationsProps) {
  return (
    <section className="pt-2" style={{ minHeight: "200px" }} aria-labelledby="new-notifications-heading">
      <div className="flex items-center gap-4 mb-3">
        <h2 id="new-notifications-heading" className="text-sm uppercase font-extrabold text-orange-500">
          New for you
        </h2>
        <div className="h-px bg-stroke-base flex-1" />
        {notifications.length > 0 && (
          <SecondaryButton
            size="xs"
            testId="mark-all-read"
            onClick={onMarkAllNotificationsAsRead}
            loading={isMarkingAllNotificationsAsRead}
          >
            Mark all read
          </SecondaryButton>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="px-12 pt-16 py-20 text-content-accent font-medium flex items-center flex-col gap-2">
          <IconSparkles className="text-yellow-500" />
          Nothing new for you.
        </div>
      ) : (
        <NotificationList
          notifications={notifications}
          formattedTimePreferences={formattedTimePreferences}
          onOpenNotification={onOpenNotification}
          onMarkNotificationAsRead={onMarkNotificationAsRead}
        />
      )}
    </section>
  );
}

function PreviousNotifications({
  notifications,
  formattedTimePreferences,
  onOpenNotification,
  onMarkNotificationAsRead,
}: NotificationListProps) {
  return (
    <section className="mt-6 -mx-12 -my-10 rounded-b-lg border-t border-surface-outline bg-surface-dimmed px-12 py-10">
      <h2 className="text-content-accent font-bold mb-2">Previous Notifications</h2>
      <NotificationList
        notifications={notifications}
        formattedTimePreferences={formattedTimePreferences}
        onOpenNotification={onOpenNotification}
        onMarkNotificationAsRead={onMarkNotificationAsRead}
      />
    </section>
  );
}

function NotificationList({
  notifications,
  formattedTimePreferences,
  onOpenNotification,
  onMarkNotificationAsRead,
}: NotificationListProps) {
  return (
    <>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          formattedTimePreferences={formattedTimePreferences}
          onOpenNotification={onOpenNotification}
          onMarkNotificationAsRead={onMarkNotificationAsRead}
        />
      ))}
    </>
  );
}

function NotificationItem({
  notification,
  formattedTimePreferences,
  onOpenNotification,
  onMarkNotificationAsRead,
}: {
  notification: NotificationsPage.Notification;
  formattedTimePreferences: FormattedTimePreferences;
  onOpenNotification: NotificationsPage.Props["onOpenNotification"];
  onMarkNotificationAsRead: NotificationsPage.Props["onMarkNotificationAsRead"];
}) {
  const rowProps = {
    title: notification.title,
    insertedAt: notification.insertedAt,
    formattedTimePreferences,
    read: notification.read,
    testId: notification.testId,
    onOpen: () => onOpenNotification(notification),
    onMarkAsRead: () => onMarkNotificationAsRead(notification),
  };

  if (notification.type === "operately") return <OperatelyNotificationRow {...rowProps} />;

  return <NotificationRow {...rowProps} author={notification.author} location={notification.location} />;
}
