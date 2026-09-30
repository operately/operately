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
  document.body.style.overflow = "auto";
  const view = render(
    <>
      <Modal isOpen onClose={closeOuter}>
        Outer
      </Modal>
      <Modal isOpen onClose={closeInner}>
        Inner
      </Modal>
    </>,
  );
  fireEvent.keyDown(document, { key: "Escape" });
  expect(closeInner).toHaveBeenCalledTimes(1);
  expect(closeOuter).not.toHaveBeenCalled();
  view.rerender(
    <Modal isOpen onClose={closeOuter}>
      Outer
    </Modal>,
  );
  expect(document.body.style.overflow).toBe("hidden");
  view.unmount();
  expect(document.body.style.overflow).toBe("auto");
  document.body.style.overflow = "";
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
