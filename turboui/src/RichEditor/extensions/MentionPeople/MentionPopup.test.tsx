import { ReactRenderer } from "@tiptap/react";

import { MentionPopup, MENTION_POPUP_Z_INDEX } from "./MentionPopup";

jest.mock("@tiptap/react", () => ({
  ReactRenderer: jest.fn(),
}));

describe("MentionPopup", () => {
  it("mounts the popup above slide-in overlays so @mentions are visible", () => {
    const element = document.createElement("div");
    const mount = jest.fn(() => jest.fn());
    const destroy = jest.fn();

    (ReactRenderer as unknown as jest.Mock).mockImplementation(() => ({
      element,
      updateProps: jest.fn(),
      destroy,
      ref: null,
    }));

    const popup = new MentionPopup();
    popup.onStart({
      clientRect: () => new DOMRect(0, 0, 0, 0),
      mount,
      editor: {},
      items: [],
      command: jest.fn(),
    });

    expect(element.style.zIndex).toBe(String(MENTION_POPUP_Z_INDEX));
    expect(Number(element.style.zIndex)).toBeGreaterThan(50);
    expect(mount).toHaveBeenCalledWith(element);
  });
});

it("keeps shadow-root suggestions open for selection and dismisses clicks outside the editor", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const shadow = host.attachShadow({ mode: "open" });
  const editorElement = document.createElement("div");
  const popupElement = document.createElement("div");
  const option = document.createElement("button");
  popupElement.append(option);
  shadow.append(editorElement);
  const dismiss = jest.fn();
  const view = { dom: editorElement };
  (ReactRenderer as unknown as jest.Mock).mockImplementation(() => ({
    element: popupElement,
    updateProps: jest.fn(),
    destroy: jest.fn(),
    ref: null,
  }));
  const popup = new MentionPopup(dismiss);
  popup.onStart({
    clientRect: () => new DOMRect(),
    editor: { view },
    items: [],
    command: jest.fn(),
    mount: (element: HTMLElement) => {
      shadow.append(element);
      return () => element.remove();
    },
  });

  option.dispatchEvent(new Event("pointerdown", { bubbles: true, composed: true }));
  editorElement.dispatchEvent(new Event("pointerdown", { bubbles: true, composed: true }));
  expect(dismiss).not.toHaveBeenCalled();
  document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
  expect(dismiss).toHaveBeenCalledWith(view);

  popup.onExit();
  dismiss.mockClear();
  document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
  expect(dismiss).not.toHaveBeenCalled();
  host.remove();
});
