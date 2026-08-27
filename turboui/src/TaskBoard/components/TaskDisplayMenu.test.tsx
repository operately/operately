import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { TaskDisplayMenu } from "./TaskDisplayMenu";

describe("TaskDisplayMenu", () => {
  it("combines layout and closed-status visibility controls", async () => {
    const user = userEvent.setup();
    const onVisibilityChange = jest.fn();

    render(
      <TaskDisplayMenu
        mode="board"
        onChange={jest.fn()}
        closedStatuses={{
          count: 2,
          visible: true,
          onVisibilityChange,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Display options" }));

    const menu = getDisplayMenu();
    const closedStatusesSwitch = within(menu).getByRole("switch", { name: "Show closed statuses" });

    expect(within(menu).getByText("Layout")).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "List" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Board" })).toHaveAttribute("aria-pressed", "true");
    expect(within(menu).getByText("2")).toBeInTheDocument();
    expect(closedStatusesSwitch).toBeChecked();

    await user.click(closedStatusesSwitch);

    expect(onVisibilityChange).toHaveBeenCalledWith(false);
  });

  it("shows only board visibility controls when no layout selector is provided", async () => {
    const user = userEvent.setup();

    render(
      <TaskDisplayMenu
        closedStatuses={{
          count: 1,
          visible: false,
          onVisibilityChange: jest.fn(),
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Display options" }));

    const menu = getDisplayMenu();

    expect(within(menu).queryByText("Layout")).not.toBeInTheDocument();
    expect(within(menu).queryByRole("menuitem", { name: "List" })).not.toBeInTheDocument();
    expect(within(menu).queryByRole("menuitem", { name: "Board" })).not.toBeInTheDocument();
    expect(within(menu).getByRole("switch", { name: "Show closed statuses" })).not.toBeChecked();
    expect(within(menu).getByText("1")).toBeInTheDocument();
  });
});

function getDisplayMenu(): HTMLElement {
  const menu = document.querySelector<HTMLElement>('[data-test-id="display-menu"]');

  if (!menu) throw new Error("Expected Display menu to be open");

  return menu;
}
