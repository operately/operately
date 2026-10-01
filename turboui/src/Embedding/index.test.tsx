import React from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { EmbeddingProvider } from "./index";
import { ConfirmDialog } from "../ConfirmDialog";
import { Modal } from "../Modal";
import { useHtmlTitle } from "../Page/useHtmlTitle";

function PageTitle() {
  useHtmlTitle("Demo");
  return null;
}

afterEach(cleanup);

test("embedded modals stay in their container and preserve the host title and scroll", () => {
  const container = document.createElement("div");
  const scroll = document.createElement("div");
  document.body.append(container, scroll);
  document.title = "Article";
  const originalOverflow = document.body.style.overflow;
  const view = render(
    <EmbeddingProvider portalContainer={container} scrollContainer={scroll} manageDocumentTitle={false}>
      <PageTitle />
      <Modal isOpen onClose={() => {}} title="Embedded">
        Demo content
      </Modal>
    </EmbeddingProvider>,
  );
  expect(container.contains(screen.getByRole("dialog"))).toBe(true);
  expect(document.title).toBe("Article");
  expect(document.body.style.overflow).toBe(originalOverflow);
  expect(scroll.style.overflow).toBe("hidden");
  view.unmount();
  expect(scroll.style.overflow).toBe("");
  container.remove();
  scroll.remove();
});

test("nested overlays close one at a time and keep scrolling locked until the last closes", () => {
  const closeOuter = jest.fn();
  const closeInner = jest.fn();
  const container = document.createElement("div");
  document.body.append(container);
  container.style.overflow = "auto";
  const view = render(
    <EmbeddingProvider portalContainer={container} scrollContainer={container}>
      <Modal isOpen onClose={closeOuter}>
        Outer
      </Modal>
      <Modal isOpen onClose={closeInner}>
        Inner
      </Modal>
    </EmbeddingProvider>,
  );
  fireEvent.keyDown(screen.getAllByRole("dialog").at(-1) as HTMLElement, { key: "Escape" });
  expect(closeInner).toHaveBeenCalledTimes(1);
  expect(closeOuter).not.toHaveBeenCalled();
  view.rerender(
    <EmbeddingProvider portalContainer={container} scrollContainer={container}>
      <Modal isOpen onClose={closeOuter}>
        Outer
      </Modal>
    </EmbeddingProvider>,
  );
  expect(container.style.overflow).toBe("hidden");
  view.unmount();
  expect(container.style.overflow).toBe("auto");
  container.remove();
});

test("an embedded confirmation claims Escape before its containing preview", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const onCancel = jest.fn();
  const view = render(
    <EmbeddingProvider portalContainer={container} scrollContainer={container}>
      <ConfirmDialog
        isOpen
        onConfirm={() => {}}
        onCancel={onCancel}
        title="Delete update?"
        message="Only sample data changes."
      />
    </EmbeddingProvider>,
  );
  const dialog = screen.getByRole("dialog");
  expect(container.contains(dialog)).toBe(true);
  expect(fireEvent.keyDown(dialog, { key: "Escape" })).toBe(false);
  expect(onCancel).toHaveBeenCalledTimes(1);
  view.unmount();
  container.remove();
});

test("without a provider, modals retain body portals, scrolling, and Escape handling", () => {
  const onClose = jest.fn();
  const view = render(
    <>
      <PageTitle />
      <Modal isOpen onClose={onClose}>
        Normal dialog
      </Modal>
    </>,
  );
  expect(screen.getByRole("dialog").parentElement).toBe(document.body);
  expect(document.title).toContain("Demo");
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(document.body.style.overflow).toBe("");
});

test("Escape and scroll locks are isolated between shadow roots, and focus returns to the opener", () => {
  function createHost() {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    const opener = document.createElement("button");
    const container = document.createElement("div");
    root.append(opener, container);
    opener.focus();
    return { host, root, opener, container };
  }
  const first = createHost();
  const closeFirst = jest.fn();
  const view = render(
    <EmbeddingProvider portalContainer={first.container} scrollContainer={first.container}>
      <Modal isOpen onClose={closeFirst}>
        <button>First</button>
      </Modal>
    </EmbeddingProvider>,
  );
  const second = createHost();
  const closeSecond = jest.fn();
  const other = render(
    <EmbeddingProvider portalContainer={second.container} scrollContainer={second.container}>
      <Modal isOpen onClose={closeSecond}>
        <button>Second</button>
      </Modal>
    </EmbeddingProvider>,
  );
  const button = second.container.querySelector("button");
  if (!button) throw new Error("Expected embedded dialog button");
  fireEvent.keyDown(button, { key: "Escape", composed: true });
  expect(closeSecond).toHaveBeenCalledTimes(1);
  expect(closeFirst).not.toHaveBeenCalled();
  other.unmount();
  expect(second.root.activeElement).toBe(second.opener);
  expect(first.container.style.overflow).toBe("hidden");
  expect(second.container.style.overflow).toBe("");
  view.unmount();
  expect(first.container.style.overflow).toBe("");
  first.host.remove();
  second.host.remove();
});

test("closing a nested dialog restores parent focus when the browser did not focus its opener", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const content = (nested: boolean) => (
    <EmbeddingProvider portalContainer={container} scrollContainer={container}>
      <Modal isOpen onClose={() => {}}>
        <button data-testid="parent-control">Parent</button>
      </Modal>
      {nested && (
        <Modal isOpen onClose={() => {}}>
          <button>Child</button>
        </Modal>
      )}
    </EmbeddingProvider>
  );
  const view = render(content(false));
  const parent = screen.getByTestId("parent-control");
  parent.blur(); // WebKit does not focus buttons on pointer clicks.
  view.rerender(content(true));
  view.rerender(content(false));
  expect(document.activeElement).toBe(parent);
  view.unmount();
  container.remove();
});

test("restores the clicked opener when the browser leaves it unfocused", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = host.attachShadow({ mode: "open" });
  const container = document.createElement("div");
  root.append(container);
  function Example() {
    const [open, setOpen] = React.useState(false);
    return (
      <EmbeddingProvider portalContainer={container} scrollContainer={container}>
        <button data-testid="opener" onClick={() => setOpen(true)}>
          Open
        </button>
        <Modal isOpen={open} onClose={() => setOpen(false)}>
          <button data-testid="inside">Inside</button>
        </Modal>
      </EmbeddingProvider>
    );
  }
  const view = render(<Example />, { container });
  const opener = view.getByTestId("opener");
  fireEvent.pointerDown(opener);
  fireEvent.click(opener);
  const inside = view.getByTestId("inside");
  fireEvent.keyDown(inside, { key: "Escape", composed: true });
  expect(root.activeElement).toBe(opener);
  view.unmount();
  host.remove();
});

test("an unrelated popup does not disable Tab containment in the modal", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const popup = document.createElement("div");
  popup.setAttribute("data-radix-popper-content-wrapper", "");
  popup.innerHTML = '<div role="tooltip">Hint</div>';
  container.append(popup);
  const view = render(
    <EmbeddingProvider portalContainer={container} scrollContainer={container}>
      <Modal isOpen onClose={() => {}}>
        <button data-testid="first">First</button>
        <button data-testid="last">Last</button>
      </Modal>
    </EmbeddingProvider>,
  );
  const first = screen.getByTestId("first");
  const last = screen.getByTestId("last");
  const visible = mockVisibleControls();
  try {
    last.focus();
    expect(fireEvent.keyDown(last, { key: "Tab" })).toBe(false);
    expect(document.activeElement).toBe(first);
    expect(fireEvent.keyDown(first, { key: "Tab", shiftKey: true })).toBe(false);
    expect(document.activeElement).toBe(last);
  } finally {
    visible.mockRestore();
    view.unmount();
    container.remove();
  }
});

test("closing a parent preserves the child's focus and restores the original opener after the last close", () => {
  const container = document.createElement("div");
  const opener = document.createElement("button");
  document.body.append(opener, container);
  opener.focus();
  const closeChild = jest.fn();
  const content = (parent: boolean, child: boolean) => (
    <EmbeddingProvider portalContainer={container} scrollContainer={container}>
      <Modal isOpen={parent} onClose={() => {}}>
        <button data-testid="parent">Parent</button>
      </Modal>
      <Modal isOpen={child} onClose={closeChild}>
        <button data-testid="child">Child</button>
      </Modal>
    </EmbeddingProvider>
  );
  const view = render(content(true, false));
  view.rerender(content(true, true));
  const child = screen.getByTestId("child");
  expect(document.activeElement).toBe(child);
  view.rerender(content(false, true));
  expect(document.activeElement).toBe(child);
  expect(container.style.overflow).toBe("hidden");
  fireEvent.keyDown(child, { key: "Escape" });
  expect(closeChild).toHaveBeenCalledTimes(1);
  view.rerender(content(false, false));
  expect(document.activeElement).toBe(opener);
  expect(container.style.overflow).toBe("");
  view.unmount();
  opener.remove();
  container.remove();
});

test("Tab stays in a focused portaled popup without jumping into its parent dialog", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const view = render(
    <EmbeddingProvider portalContainer={container} scrollContainer={container}>
      <Modal isOpen onClose={() => {}}>
        <button>Parent</button>
      </Modal>
    </EmbeddingProvider>,
  );
  const popup = document.createElement("div");
  popup.setAttribute("data-radix-popper-content-wrapper", "");
  const first = document.createElement("button");
  const last = document.createElement("button");
  popup.append(first, last);
  container.append(popup);
  const visible = mockVisibleControls();
  try {
    last.focus();
    expect(fireEvent.keyDown(last, { key: "Tab" })).toBe(false);
    expect(document.activeElement).toBe(first);
    expect(fireEvent.keyDown(first, { key: "Tab", shiftKey: true })).toBe(false);
    expect(document.activeElement).toBe(last);
  } finally {
    visible.mockRestore();
    view.unmount();
    container.remove();
  }
});

function mockVisibleControls() {
  const rectangles = [document.body.getBoundingClientRect()];
  return jest
    .spyOn(HTMLElement.prototype, "getClientRects")
    .mockReturnValue(Object.assign(rectangles, { item: (index: number) => rectangles[index] ?? null }));
}
