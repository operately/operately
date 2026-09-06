import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { OperatelyNotificationRow } from "./OperatelyNotificationRow";

function renderNotification(overrides: Partial<React.ComponentProps<typeof OperatelyNotificationRow>> = {}) {
  const props: React.ComponentProps<typeof OperatelyNotificationRow> = {
    title: "New: Faster search",
    insertedAt: "2026-08-10T12:00:00Z",
    formattedTimePreferences: defaultFormattedTimePreferences,
    read: false,
    testId: "notification-item-operately-update",
    onOpen: jest.fn(),
    onMarkAsRead: jest.fn(),
    ...overrides,
  };

  render(<OperatelyNotificationRow {...props} />);

  return props;
}

describe("OperatelyNotificationRow", () => {
  it("shows the Operately logo, author, title, and date", () => {
    renderNotification();

    expect(screen.getByText("New: Faster search")).toBeInTheDocument();
    expect(screen.getByText("Operately")).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="operately-notification-logo"]')).toHaveAttribute("width", "32px");
  });

  it("marks the notification as read without opening it", () => {
    const props = renderNotification();

    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));

    expect(props.onMarkAsRead).toHaveBeenCalledTimes(1);
    expect(props.onOpen).not.toHaveBeenCalled();
  });
});
