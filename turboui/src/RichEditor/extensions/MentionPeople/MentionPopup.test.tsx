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
