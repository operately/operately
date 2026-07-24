import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { NotificationRow } from ".";

jest.mock("../icons", () => ({
  IconCheck: () => <span data-testid="check-icon" />,
}));

const author = {
  id: "person-1",
  fullName: "Ada Lovelace",
  avatarUrl: null,
};

function renderNotificationRow(overrides: Partial<React.ComponentProps<typeof NotificationRow>> = {}) {
  const props: React.ComponentProps<typeof NotificationRow> = {
    author,
    title: "Updated the roadmap",
    location: "Launch project",
    insertedAt: "2026-07-23T12:00:00Z",
    formattedTimePreferences: defaultFormattedTimePreferences,
    read: false,
    testId: "notification-item-project-updated",
    onOpen: jest.fn(),
    onMarkAsRead: jest.fn(),
    ...overrides,
  };

  render(<NotificationRow {...props} />);

  return props;
}

describe("NotificationRow", () => {
  it("shows an accessible checkmark action for unread notifications", () => {
    renderNotificationRow();

    expect(screen.getByRole("button", { name: "Mark as read" })).toBeInTheDocument();
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
  });

  it("marks a notification as read without opening it", () => {
    const props = renderNotificationRow();

    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));

    expect(props.onMarkAsRead).toHaveBeenCalledTimes(1);
    expect(props.onOpen).not.toHaveBeenCalled();
  });

  it("does not show the mark-as-read action for read notifications", () => {
    renderNotificationRow({ read: true });

    expect(screen.queryByRole("button", { name: "Mark as read" })).not.toBeInTheDocument();
  });
});
