import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { NotificationsPage } from ".";

function notification(overrides: Partial<NotificationsPage.Notification> = {}): NotificationsPage.Notification {
  return {
    id: "notification-1",
    read: false,
    author: {
      id: "person-1",
      fullName: "Ada Lovelace",
      avatarUrl: null,
    },
    title: "Updated the launch roadmap",
    location: "Launch project",
    insertedAt: "2026-07-23T12:00:00Z",
    testId: "notification-item-project-updated",
    ...overrides,
  };
}

function renderPage(overrides: Partial<NotificationsPage.Props> = {}) {
  const props: NotificationsPage.Props = {
    notifications: [
      notification(),
      notification({
        id: "notification-2",
        read: true,
        title: "Created a project",
        testId: "notification-item-project-created",
      }),
    ],
    formattedTimePreferences: defaultFormattedTimePreferences,
    onOpenNotification: jest.fn(),
    onMarkNotificationAsRead: jest.fn(),
    onMarkAllNotificationsAsRead: jest.fn(),
    ...overrides,
  };

  render(<NotificationsPage {...props} />);

  return props;
}

function getByDataTestId(testId: string) {
  const element = document.querySelector(`[data-test-id="${testId}"]`);

  if (!element) throw new Error(`Expected an element with data-test-id="${testId}".`);

  return element;
}

describe("NotificationsPage", () => {
  it("groups unread and previously read notifications", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText("Here's every notification you've received from Operately.")).toBeInTheDocument();
    expect(screen.getByText("New for you")).toBeInTheDocument();
    expect(screen.getByText("Previous Notifications")).toBeInTheDocument();
    expect(getByDataTestId("notification-item-project-updated")).toBeInTheDocument();
    expect(getByDataTestId("notification-item-project-created")).toBeInTheDocument();
  });

  it("shows an empty state when there are no unread notifications", () => {
    renderPage({ notifications: [notification({ read: true })] });

    expect(screen.getByText("Nothing new for you.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark all read" })).not.toBeInTheDocument();
  });

  it("reports notification actions to the bridge", () => {
    const props = renderPage();
    const unreadNotification = props.notifications[0]!;

    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));
    fireEvent.click(getByDataTestId("notification-item-project-updated"));
    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));

    expect(props.onMarkNotificationAsRead).toHaveBeenCalledWith(unreadNotification);
    expect(props.onOpenNotification).toHaveBeenCalledWith(unreadNotification);
    expect(props.onMarkAllNotificationsAsRead).toHaveBeenCalledTimes(1);
  });

  it("shows loading feedback while all notifications are being marked as read", () => {
    renderPage({ isMarkingAllNotificationsAsRead: true });

    expect(screen.getByRole("button", { name: "Mark all read" })).toBeDisabled();
  });
});
