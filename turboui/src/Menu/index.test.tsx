import React from "react";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { Menu, MenuActionItem } from "./index";

function renderMenu(readonly?: boolean) {
  return render(
    <MemoryRouter>
      <Menu testId="example-menu" readonly={readonly}>
        <MenuActionItem testId="example-menu-item" onClick={() => undefined}>
          Edit
        </MenuActionItem>
      </Menu>
    </MemoryRouter>,
  );
}

describe("Menu", () => {
  it("opens items when not read-only", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(document.querySelector('[data-test-id="example-menu"]') as HTMLElement);
    await waitFor(() => {
      expect(document.querySelector('[data-test-id="example-menu-item"]')).toHaveTextContent("Edit");
    });
  });

  it("does not open items when read-only", async () => {
    const user = userEvent.setup();
    renderMenu(true);

    await user.click(document.querySelector('[data-test-id="example-menu"]') as HTMLElement);
    expect(document.querySelector('[data-test-id="example-menu-item"]')).not.toBeInTheDocument();
  });
});
