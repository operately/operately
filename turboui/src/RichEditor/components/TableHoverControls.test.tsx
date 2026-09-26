import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { Editor, useEditor } from "..";
import { assertPresent } from "../../utils/assertions";

let editor: TiptapEditor;
const content = {
  type: "doc",
  content: [
    {
      type: "table",
      content: ["A", "B"].map((label, row) => ({
        type: "tableRow",
        content: [1, 2].map((column) => ({
          type: row === 0 ? "tableHeader" : "tableCell",
          content: [{ type: "paragraph", content: [{ type: "text", text: `${label}${column}` }] }],
        })),
      })),
    },
  ],
};

function Harness({ editable = true }) {
  const state = useEditor({ content, editable, handlers: { mentionedPersonLookup: async () => null } });
  React.useEffect(() => {
    editor = state.editor;
  }, [state.editor]);
  return <Editor editor={state} />;
}

function setup(editable = true) {
  const result = render(<Harness editable={editable} />);
  const rect = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  });
  result.container.querySelectorAll("table, .tableWrapper").forEach((element) => {
    jest.spyOn(element, "getBoundingClientRect").mockReturnValue(rect(100, 100, 200, 80));
  });
  result.container.querySelectorAll("th, td").forEach((cell, index) => {
    jest
      .spyOn(cell, "getBoundingClientRect")
      .mockReturnValue(rect(100 + (index % 2) * 100, 100 + Math.floor(index / 2) * 40, 100, 40));
  });
  return result;
}

function hover(x: number, y: number, extra = {}) {
  fireEvent.pointerMove(editor.view.dom, { clientX: x, clientY: y, pointerType: "mouse", ...extra });
}

beforeEach(() => {
  jest.useFakeTimers();
  // JSDOM does not implement PointerEvent or text geometry.
  window.PointerEvent = MouseEvent as typeof PointerEvent;
  Range.prototype.getClientRects = () => document.createElement("div").getClientRects();
  Range.prototype.getBoundingClientRect = () => document.createElement("div").getBoundingClientRect();
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

it("waits 200 ms on a boundary and cancels when the pointer leaves", () => {
  setup();
  hover(200, 120);
  act(() => jest.advanceTimersByTime(199));
  expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
  act(() => jest.advanceTimersByTime(1));
  expect(screen.getByRole("button", { name: "Add column" })).toBeInTheDocument();
  hover(150, 120);
  expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
  hover(200, 120);
  hover(150, 120);
  act(() => jest.advanceTimersByTime(200));
  expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
});

it.each([
  [100, 120, "Add column", ["", "A1", "A2"]],
  [200, 120, "Add column", ["A1", "", "A2"]],
  [300, 120, "Add column", ["A1", "A2", ""]],
  [150, 100, "Add row", ["", "A1A2", "B1B2"]],
  [150, 140, "Add row", ["A1A2", "", "B1B2"]],
  [150, 180, "Add row", ["A1A2", "B1B2", ""]],
] as const)("inserts at boundary (%s, %s), preserving headers and undo", (x, y, label, expected) => {
  const { container } = setup();
  const original = editor.getJSON();
  hover(x, y);
  act(() => jest.advanceTimersByTime(200));
  const button = screen.getByRole("button", { name: label });
  fireEvent.pointerMove(button, { clientX: x, clientY: y });
  fireEvent.click(button);
  const nodes =
    label === "Add column" ? container.querySelectorAll("tr:first-child th") : container.querySelectorAll("tr");
  expect(Array.from(nodes, (node) => node.textContent)).toEqual(expected);
  expect(container.querySelectorAll("tr:not(:first-child) th")).toHaveLength(0);
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(original);
});

it("hides stale targets after scrolling, content changes, or switching to read-only", () => {
  setup();
  hover(200, 120);
  act(() => jest.advanceTimersByTime(200));
  fireEvent.scroll(editor.view.dom.querySelector(".tableWrapper") ?? editor.view.dom);
  expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
  hover(200, 120);
  act(() => editor.commands.setContent({ type: "doc", content: [{ type: "paragraph" }] }));
  act(() => jest.advanceTimersByTime(200));
  expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
  act(() => editor.setEditable(false));
  hover(200, 120);
  act(() => jest.advanceTimersByTime(200));
  expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
});

it("does not show controls in read-only content or while dragging a selection", () => {
  setup(false);
  hover(200, 120);
  act(() => jest.advanceTimersByTime(200));
  expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
  act(() => editor.setEditable(true));
  hover(200, 120, { buttons: 1 });
  act(() => jest.advanceTimersByTime(200));
  expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
});

it("supports keyboard activation and uses the hovered cell rather than the text cursor", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const { container } = setup();
  act(() => editor.commands.setTextSelection(editor.state.doc.content.size - 1));
  hover(200, 120);
  act(() => jest.advanceTimersByTime(200));
  screen.getByRole("button", { name: "Add column" }).focus();
  await user.keyboard("{Enter}");
  expect(container.querySelectorAll("th")).toHaveLength(3);
  expect(container.querySelectorAll("table")).toHaveLength(1);
});

it("does not mistake a clipped table edge for a column boundary", () => {
  const { container } = setup();
  const wrapper = container.querySelector(".tableWrapper");
  assertPresent(wrapper, "Expected the table scroll wrapper");
  jest.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
    ...wrapper.getBoundingClientRect(),
    left: 120,
    right: 250,
    width: 130,
  });
  hover(250, 120);
  act(() => jest.advanceTimersByTime(200));
  expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
  hover(200, 120);
  act(() => jest.advanceTimersByTime(200));
  expect(screen.getByRole("button", { name: "Add column" })).toBeInTheDocument();
});

it("ignores touch pointers and cancels pending timers when unmounted", () => {
  const { unmount } = setup();
  const event = new MouseEvent("pointermove", { bubbles: true, clientX: 200, clientY: 120 });
  Object.defineProperty(event, "pointerType", { value: "touch" });
  fireEvent(editor.view.dom, event);
  act(() => jest.advanceTimersByTime(200));
  expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
  hover(200, 120);
  unmount();
  act(() => jest.advanceTimersByTime(200));
  expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
});
