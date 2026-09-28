import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { Editor as TiptapEditor, JSONContent } from "@tiptap/core";
import { Editor, useEditor } from "..";
import { ToasterBar } from "../../Toasts";
import toast from "react-hot-toast";
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

function Harness({ editable = true, initialContent = content }: { editable?: boolean; initialContent?: JSONContent }) {
  const state = useEditor({ content: initialContent, editable, handlers: { mentionedPersonLookup: async () => null } });
  React.useEffect(() => {
    editor = state.editor;
  }, [state.editor]);
  return (
    <>
      <Editor editor={state} hideToolbar />
      <ToasterBar />
    </>
  );
}

function setup(editable = true, initialContent: JSONContent = content) {
  const result = render(<Harness editable={editable} initialContent={initialContent} />);
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
  result.container.querySelectorAll("tr").forEach((row, index) => {
    jest.spyOn(row, "getBoundingClientRect").mockReturnValue(rect(100, 100 + index * 40, 200, 40));
  });
  result.container.querySelectorAll("th, td").forEach((cell, index) => {
    jest
      .spyOn(cell, "getBoundingClientRect")
      .mockReturnValue(rect(100 + (index % 2) * 100, 100 + Math.floor(index / 2) * 40, 100, 40));
  });
  return result;
}

function move(index = 0, options: PointerEventInit = {}) {
  const cell = editor.view.dom.querySelectorAll("th, td")[index];
  assertPresent(cell);
  fireEvent.pointerMove(cell, {
    clientX: 105 + (index % 2) * 100,
    clientY: 105 + Math.floor(index / 2) * 40,
    ...options,
  });
}
const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  });
  window.PointerEvent = MouseEvent as typeof PointerEvent;
  Range.prototype.getClientRects = () => document.createElement("div").getClientRects();
  Range.prototype.getBoundingClientRect = () => document.createElement("div").getBoundingClientRect();
});
afterEach(() => {
  act(() => toast.remove());
  jest.clearAllTimers();
  jest.useRealTimers();
});

function openMenu(axis: "row" | "column") {
  fireEvent.pointerDown(screen.getByRole("button", { name: axis === "row" ? "Row actions" : "Column actions" }), {
    button: 0,
    ctrlKey: false,
  });
}

function deleteAxis(axis: "row" | "column") {
  openMenu(axis);
  fireEvent.click(screen.getByRole("menuitem", { name: `Delete ${axis}` }));
}

it("reveals menus near the left and top edges, but not while hovering inside cells", () => {
  setup();
  move(0, { clientX: 150, clientY: 130 });
  advance(500);
  expect(screen.queryByRole("button", { name: "Row actions" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Column actions" })).not.toBeInTheDocument();
  move();
  advance(500);
  expect(screen.getByRole("button", { name: "Row actions" })).toHaveStyle({ left: "86px", top: "120px" });
  expect(screen.getByRole("button", { name: "Column actions" })).toHaveStyle({ left: "150px", top: "86px" });
});

it("keeps an open menu and its highlighted target stable until dismissed", () => {
  setup();
  const original = editor.getJSON();
  move();
  advance(500);
  openMenu("row");
  expect(editor.getJSON()).toEqual(original);
  expect(document.querySelector('[data-test-id="table-menu-preview-row"]')).toHaveStyle({
    width: "200px",
    height: "40px",
  });
  move(3);
  advance(10000);
  expect(screen.getByRole("menuitem", { name: "Delete row" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("menuitem", { name: "Delete row" }));
  expect(editor.view.dom.querySelector("tr")?.textContent).toBe("B1B2");
});

it("closes on outside click without changing content", () => {
  setup();
  const original = editor.getJSON();
  move();
  advance(500);
  openMenu("column");
  advance(1);
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(editor.getJSON()).toEqual(original);
});

it.each(["row", "column"] as const)("deletes the hovered %s and restores it with toast Undo", (axis) => {
  setup();
  act(() => editor.commands.setTextSelection(editor.state.doc.content.size - 1));
  const original = editor.getJSON();
  move();
  advance(500);
  deleteAxis(axis);
  expect(editor.getJSON()).not.toEqual(original);
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(editor.getJSON()).toEqual(original);
});

it("opens with the keyboard, closes with Escape, and deletes with Enter", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  setup();
  act(() => editor.commands.focus());
  advance(20);
  expect(editor.isFocused).toBe(true);
  move();
  advance(500);
  const button = screen.getByRole("button", { name: "Column actions" });
  act(() => button.focus());
  advance(4000);
  expect(button).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("menu")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(button).toHaveFocus();
  await user.keyboard("{Enter}");
  await user.keyboard("{End}{Enter}");
  expect(editor.view.dom.querySelectorAll("th")).toHaveLength(1);
});

it("hides on typing, selection dragging, scrolling, and read-only changes", () => {
  setup();
  move();
  advance(500);
  fireEvent.keyDown(editor.view.dom, { key: "a" });
  expect(screen.queryByRole("button", { name: "Row actions" })).not.toBeInTheDocument();
  move(0, { buttons: 1 });
  advance(500);
  expect(screen.queryByRole("button", { name: "Row actions" })).not.toBeInTheDocument();
  move();
  advance(500);
  fireEvent.scroll(window);
  expect(screen.queryByRole("button", { name: "Row actions" })).not.toBeInTheDocument();
  move();
  advance(500);
  act(() => editor.setEditable(false));
  expect(screen.queryByRole("button", { name: "Row actions" })).not.toBeInTheDocument();
});

it("dismisses toast Undo after later edits so it cannot undo unrelated typing", () => {
  setup();
  move();
  advance(500);
  deleteAxis("row");
  expect(within(screen.getByRole("status")).getByRole("button")).toBeInTheDocument();
  act(() => editor.commands.insertContent("New text"));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  act(() => editor.commands.undo());
  expect(editor.view.dom.querySelectorAll("tr")).toHaveLength(1);
  expect(editor.getText()).not.toContain("New text");
});

it("never shows deletion controls in read-only content", () => {
  setup(false);
  move();
  advance(3000);
  expect(screen.queryByRole("button", { name: "Row actions" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Column actions" })).not.toBeInTheDocument();
});

it("hides clipped row controls while leaving visible column controls available", () => {
  const { container } = setup();
  const wrapper = container.querySelector(".tableWrapper");
  assertPresent(wrapper);
  jest.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
    ...wrapper.getBoundingClientRect(),
    left: 110,
    width: 190,
  });
  move(1, { clientX: 250, clientY: 105 });
  advance(500);
  expect(screen.queryByRole("button", { name: "Row actions" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Column actions" })).toBeInTheDocument();
});

it("dismisses Undo on unmount", () => {
  const { unmount } = setup();
  move();
  advance(500);
  deleteAxis("row");
  expect(within(screen.getByRole("status")).getByRole("button")).toBeInTheDocument();
  unmount();
  render(<ToasterBar />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it.each(["row", "column"] as const)("deletes the final %s and restores the table with Undo", (axis) => {
  setup(true, {
    type: "doc",
    content: [
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Only cell" }] }] },
            ],
          },
        ],
      },
      { type: "paragraph" },
    ],
  });
  const original = editor.getJSON();
  move();
  advance(500);
  deleteAxis(axis);
  expect(editor.view.dom.querySelector("table")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(editor.getJSON()).toEqual(original);
});

it("cancels pending targets on content replacement and ignores touch pointers", () => {
  setup();
  const cell = editor.view.dom.querySelector("th");
  assertPresent(cell);
  const event = new MouseEvent("pointermove", { bubbles: true, clientX: 150, clientY: 120 });
  Object.defineProperty(event, "pointerType", { value: "touch" });
  fireEvent(cell, event);
  advance(500);
  expect(screen.queryByRole("button", { name: "Row actions" })).not.toBeInTheDocument();
  move();
  act(() => editor.commands.setContent({ type: "doc", content: [{ type: "paragraph" }] }));
  advance(500);
  expect(screen.queryByRole("button", { name: "Row actions" })).not.toBeInTheDocument();
});

it.each(["scroll", "content replacement", "read-only"])("dismisses an open menu on %s", (change) => {
  setup();
  move();
  advance(500);
  openMenu("row");
  expect(screen.getByRole("menu")).toBeInTheDocument();
  if (change === "scroll") fireEvent.scroll(window);
  if (change === "content replacement") act(() => editor.commands.setContent(content));
  if (change === "read-only") act(() => editor.setEditable(false));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(document.querySelector('[data-test-id="table-menu-preview-row"]')).not.toBeInTheDocument();
});

it("keeps a revealed handle reachable across the margin without an idle timeout", () => {
  setup();
  move(2);
  advance(500);
  fireEvent.pointerMove(document.body, { clientX: 98, clientY: 160 });
  advance(10000);
  expect(screen.getByRole("button", { name: "Row actions" })).toBeInTheDocument();
  openMenu("row");
  expect(screen.getByRole("menuitem", { name: "Delete row" })).toBeInTheDocument();
});

it.each([
  { axis: "row", label: "Add row above", blankIndex: 0 },
  { axis: "row", label: "Add row below", blankIndex: 1 },
  { axis: "column", label: "Add column before", blankIndex: 0 },
  { axis: "column", label: "Add column after", blankIndex: 1 },
] as const)("$label inserts next to the menu target and supports Undo", ({ axis, label, blankIndex }) => {
  setup();
  act(() => editor.commands.setTextSelection(editor.state.doc.content.size - 1));
  const original = editor.getJSON();
  move();
  advance(500);
  openMenu(axis);
  move(3);
  fireEvent.click(screen.getByRole("menuitem", { name: label }));
  const rows = editor.view.dom.querySelectorAll("tr");
  if (axis === "row") {
    expect(rows).toHaveLength(3);
    expect(rows[blankIndex]?.textContent).toBe("");
    expect(rows[blankIndex === 0 ? 1 : 0]?.textContent).toBe("A1A2");
    expect(rows[0]?.querySelectorAll("th")).toHaveLength(2);
  } else {
    expect(rows[0]?.children).toHaveLength(3);
    expect(rows[0]?.children[blankIndex]?.textContent).toBe("");
    expect(rows[0]?.children[blankIndex === 0 ? 1 : 0]?.textContent).toBe("A1");
  }
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  advance(20);
  expect(editor.isFocused).toBe(true);
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(original);
});
