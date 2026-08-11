import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { genPeople } from "../utils/storybook/genPeople";
import { NotificationsPage } from ".";

const meta = {
  title: "Pages/NotificationsPage",
  component: NotificationsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof NotificationsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const notificationAuthors = genPeople(3);

const notifications: NotificationsPage.Notification[] = [
  {
    id: "notification-1",
    read: false,
    author: notificationAuthors[0]!,
    title: "Updated the launch roadmap",
    location: "Launch project",
    insertedAt: "2026-07-23T12:00:00Z",
    testId: "notification-item-project-updating",
  },
  {
    id: "notification-2",
    read: false,
    author: notificationAuthors[1]!,
    title: "Assigned you a task",
    location: "Website redesign",
    insertedAt: "2026-07-22T15:00:00Z",
    testId: "notification-item-task-assignment",
  },
  {
    id: "notification-3",
    read: true,
    author: notificationAuthors[2]!,
    title: "Created a project",
    location: "Product development",
    insertedAt: "2026-07-21T09:00:00Z",
    testId: "notification-item-project-created",
  },
];

function InteractiveNotificationsPage({
  initialNotifications = notifications,
}: {
  initialNotifications?: NotificationsPage.Notification[];
}) {
  const [currentNotifications, setCurrentNotifications] = React.useState(initialNotifications);

  const markNotificationAsRead = React.useCallback((notification: NotificationsPage.Notification) => {
    setCurrentNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllNotificationsAsRead = React.useCallback(() => {
    setCurrentNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }, []);

  return (
    <NotificationsPage
      notifications={currentNotifications}
      formattedTimePreferences={defaultFormattedTimePreferences}
      onOpenNotification={() => undefined}
      onMarkNotificationAsRead={markNotificationAsRead}
      onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
    />
  );
}

export const Default: Story = {
  args: {
    notifications,
    formattedTimePreferences: defaultFormattedTimePreferences,
    onOpenNotification: () => undefined,
    onMarkNotificationAsRead: () => undefined,
    onMarkAllNotificationsAsRead: () => undefined,
  },
  render: () => <InteractiveNotificationsPage />,
};

export const Empty: Story = {
  args: {
    notifications: [],
    formattedTimePreferences: defaultFormattedTimePreferences,
    onOpenNotification: () => undefined,
    onMarkNotificationAsRead: () => undefined,
    onMarkAllNotificationsAsRead: () => undefined,
  },
  render: () => <InteractiveNotificationsPage initialNotifications={[]} />,
};

export const MarkingAllAsRead: Story = {
  args: {
    notifications,
    formattedTimePreferences: defaultFormattedTimePreferences,
    onOpenNotification: () => undefined,
    onMarkNotificationAsRead: () => undefined,
    onMarkAllNotificationsAsRead: () => undefined,
    isMarkingAllNotificationsAsRead: true,
  },
};
