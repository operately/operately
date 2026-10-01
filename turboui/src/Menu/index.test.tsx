import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { EmbeddingProvider } from "../Embedding";
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
  it("skips disabled actions during keyboard navigation", async () => {
    const user = userEvent.setup();
    const disabled = jest.fn();
    const enabled = jest.fn();
    render(
      <Menu customTrigger={<button>Actions</button>}>
        <MenuActionItem disabled onClick={disabled}>
          Unavailable
        </MenuActionItem>
        <MenuActionItem onClick={enabled}>Available</MenuActionItem>
      </Menu>,
    );
    screen.getByRole("button", { name: "Actions" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Unavailable" })).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("{Enter}");
    expect(enabled).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
  });

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

test("context anchors use the positioned portal layer when it is offset from the transformed viewport", () => {
  const portal = document.createElement("div");
  portal.style.position = "absolute";
  document.body.append(portal);
  Object.defineProperty(portal, "offsetWidth", { value: 1000 });
  portal.getBoundingClientRect = () => ({ left: 150, top: 100, width: 500, height: 300 }) as DOMRect;
  const view = render(
    <EmbeddingProvider portalContainer={portal} scrollContainer={portal}>
      <Menu anchorPosition={{ x: 250, y: 200 }} open={false}>
        <MenuActionItem onClick={() => {}}>Action</MenuActionItem>
      </Menu>
    </EmbeddingProvider>,
  );
  const anchor = portal.querySelector<HTMLElement>('span[aria-hidden="true"]');
  expect(anchor).not.toBeNull();
  expect(anchor?.style.position).toBe("absolute");
  expect(anchor?.style.left).toBe("200px");
  expect(anchor?.style.top).toBe("200px");
  view.unmount();
  portal.remove();
});
