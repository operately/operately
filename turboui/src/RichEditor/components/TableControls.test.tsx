import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { CellSelection } from "@tiptap/pm/tables";
import { Editor, Content, useEditor } from "..";
import toast from "react-hot-toast";
import { ToasterBar } from "../../Toasts";
import { assertPresent } from "../../utils/assertions";

let editor: TiptapEditor;
const table = (prefix: string) => ({
  type: "table",
  content: [0, 1].map((row) => ({
    type: "tableRow",
    content: [0, 1].map((column) => ({
      type: row === 0 ? "tableHeader" : "tableCell",
      content: [{ type: "paragraph", content: [{ type: "text", text: `${prefix}${row}${column}` }] }],
    })),
  })),
});
const content = { type: "doc", content: [table("A"), { type: "paragraph" }, table("B")] };
function Harness({ readonly = false, display = false }) {
  const state = useEditor({ content, editable: !readonly, handlers: { mentionedPersonLookup: async () => null } });
  React.useEffect(() => {
    editor = state.editor;
  }, [state.editor]);
  return (
    <>
      <button>Outside</button>
      {display ? <Content editor={state} /> : <Editor editor={state} />}
    </>
  );
}
function cell(index: number) {
  const node = editor.view.dom.querySelectorAll<HTMLTableCellElement>("td, th")[index];
  assertPresent(node);
  return node;
}
function select(index = 0) {
  act(() => {
    editor.commands.setTextSelection(editor.view.posAtDOM(cell(index), 0) + 1);
    editor.view.focus();
  });
}
afterEach(() => {
  act(() => toast.remove());
});

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  });
  window.PointerEvent = MouseEvent as typeof PointerEvent;
  Range.prototype.getClientRects = () => document.createElement("div").getClientRects();
  Range.prototype.getBoundingClientRect = () => document.createElement("div").getBoundingClientRect();
});

it("shows controls only for the active table and hides them on outside focus", () => {
  render(<Harness />);
  expect(screen.queryByRole("button", { name: "Table settings" })).not.toBeInTheDocument();
  select();
  expect(screen.getAllByRole("button", { name: "Table settings" })).toHaveLength(1);
  expect(cell(0).closest(".tableWrapper")).toContainElement(screen.getByRole("button", { name: "Table settings" }));
  select(4);
  expect(cell(4).closest(".tableWrapper")).toContainElement(screen.getByRole("button", { name: "Table settings" }));
  act(() => screen.getByRole("button", { name: "Outside" }).focus());
  expect(screen.queryByRole("button", { name: "Table settings" })).not.toBeInTheDocument();
});

it("inserts next to the cursor, preserves that cell, and supports undo", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  select(1);
  const original = editor.getJSON();
  const selection = editor.state.selection.from;
  await user.click(screen.getByRole("button", { name: "Add column right" }));
  const first = editor.state.doc.firstChild;
  expect(first?.firstChild?.childCount).toBe(3);
  expect(first?.firstChild?.child(1).textContent).toBe("A01");
  expect(first?.firstChild?.child(2).textContent).toBe("");
  expect(editor.state.selection.from).toBe(selection);
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(original);
  await user.click(screen.getByRole("button", { name: "Add row below" }));
  expect(editor.state.doc.firstChild?.child(1).textContent).toBe("");
  expect(editor.state.doc.firstChild?.child(2).textContent).toBe("A10A11");
});

it("deletes only the head cell's column from a multi-cell selection", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  select();
  act(() =>
    editor.view.dispatch(
      editor.state.tr.setSelection(
        CellSelection.create(
          editor.state.doc,
          editor.view.posAtDOM(cell(0), 0) - 1,
          editor.view.posAtDOM(cell(3), 0) - 1,
        ),
      ),
    ),
  );
  await user.click(screen.getByRole("button", { name: "Delete column" }));
  expect(editor.state.doc.firstChild?.firstChild?.childCount).toBe(1);
  expect(editor.state.doc.firstChild?.textContent).toBe("A00A10");
});

it("targets the right-clicked cell and leaves normal context menus elsewhere", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  select(0);
  const original = editor.getJSON();
  jest.spyOn(editor.view, "posAtCoords").mockReturnValue(null);
  fireEvent.contextMenu(cell(7), { clientX: 80, clientY: 100 });
  expect(screen.getByRole("menu")).toBeInTheDocument();
  await user.click(screen.getByRole("menuitem", { name: "Delete row" }));
  expect(editor.state.doc.firstChild?.childCount).toBe(2);
  expect(editor.state.doc.child(2).childCount).toBe(1);
  await waitFor(() => expect(editor.isFocused).toBe(true));
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(original);
  expect(fireEvent.contextMenu(screen.getByRole("button", { name: "Outside" }))).toBe(true);
});

it("opens all insertion directions through the cog without hover", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  select();
  await user.click(screen.getByRole("button", { name: "Table settings" }));
  for (const name of [
    "Add row above",
    "Add row below",
    "Add column left",
    "Add column right",
    "Remove header row",
    "Delete table",
  ]) {
    expect(screen.getByRole("menuitem", { name })).toBeInTheDocument();
  }
  await user.click(screen.getByRole("menuitem", { name: "Add row above" }));
  expect(editor.state.doc.firstChild?.firstChild?.firstChild?.type.name).toBe("tableHeader");
  expect(editor.state.doc.firstChild?.child(1).firstChild?.type.name).toBe("tableCell");
});

it("supports keyboard access without first hovering", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  select();
  fireEvent.keyDown(editor.view.dom, { key: "F10", keyCode: 121, altKey: true });
  expect(screen.getByRole("button", { name: "Delete row" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(editor.view.dom).toHaveFocus();
  fireEvent.keyDown(editor.view.dom, { key: "F10", keyCode: 121, shiftKey: true });
  expect(screen.getByRole("menu")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(editor.view.dom).toHaveFocus());
});

it.each([{ readonly: true }, { display: true }])("never exposes controls in read-only content: %j", (props) => {
  render(<Harness {...props} />);
  select();
  expect(screen.queryByRole("button", { name: "Table settings" })).not.toBeInTheDocument();
  expect(fireEvent.contextMenu(cell(0))).toBe(true);
});

it("clears stale menus after content replacement or editing is disabled", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  select();
  await user.click(screen.getByRole("button", { name: "Table settings" }));
  act(() => editor.commands.setContent({ type: "doc", content: [{ type: "paragraph" }] }, { emitUpdate: false }));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Table settings" })).not.toBeInTheDocument();
  act(() => editor.commands.setContent(content, { emitUpdate: false }));
  select();
  act(() => editor.setEditable(false));
  expect(screen.queryByRole("button", { name: "Table settings" })).not.toBeInTheDocument();
});

it("deleting the final column removes only that table and supports undo/redo", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  select();
  await user.click(screen.getByRole("button", { name: "Delete column" }));
  const oneColumn = editor.getJSON();
  await user.click(screen.getByRole("button", { name: "Delete column" }));
  expect(editor.view.dom.querySelectorAll("table")).toHaveLength(1);
  expect(editor.view.dom.querySelector("table")).toHaveTextContent("B00");
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(oneColumn);
  act(() => editor.commands.redo());
  expect(editor.view.dom.querySelectorAll("table")).toHaveLength(1);
});

it("keeps header controls and whole-table deletion in the cog", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  select();
  await user.click(screen.getByRole("button", { name: "Table settings" }));
  await user.click(screen.getByRole("menuitem", { name: "Remove header row" }));
  expect(editor.state.doc.firstChild?.firstChild?.firstChild?.type.name).toBe("tableCell");
  await user.click(screen.getByRole("button", { name: "Table settings" }));
  await user.click(screen.getByRole("menuitem", { name: "Add header row" }));
  expect(editor.state.doc.firstChild?.firstChild?.firstChild?.type.name).toBe("tableHeader");
  await user.click(screen.getByRole("button", { name: "Table settings" }));
  await user.click(screen.getByRole("menuitem", { name: "Delete table" }));
  expect(editor.view.dom.querySelectorAll("table")).toHaveLength(1);
});

it("an outside click dismisses a menu without stealing focus", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  select();
  await user.click(screen.getByRole("button", { name: "Table settings" }));
  await user.click(screen.getByRole("button", { name: "Outside" }));
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
  expect(screen.queryByRole("button", { name: "Table settings" })).not.toBeInTheDocument();
});

function mockGeometry() {
  const rect = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  });
  editor.view.dom.querySelectorAll("table, .tableWrapper").forEach((node) => {
    jest.spyOn(node, "getBoundingClientRect").mockReturnValue(rect(100, 100, 400, 80));
  });
  editor.view.dom.querySelectorAll("tr").forEach((node, index) => {
    jest.spyOn(node, "getBoundingClientRect").mockReturnValue(rect(100, 100 + (index % 2) * 40, 400, 40));
  });
  editor.view.dom.querySelectorAll("td, th").forEach((node, index) => {
    jest
      .spyOn(node, "getBoundingClientRect")
      .mockReturnValue(rect(100 + (index % 2) * 200, 100 + Math.floor((index % 4) / 2) * 40, 200, 40));
  });
}
const preview = () => document.querySelector('[data-test-id="table-action-preview"]');

it("previews insertion boundaries and deletion axes without changing content", () => {
  render(<Harness />);
  select();
  mockGeometry();
  const original = editor.getJSON();
  fireEvent.pointerEnter(screen.getByRole("button", { name: "Add column right" }));
  expect(preview()).toHaveAttribute("data-action", "addColumnAfter");
  expect(preview()).toHaveStyle({ left: "299px", width: "2px", height: "80px" });
  fireEvent.pointerLeave(screen.getByRole("button", { name: "Add column right" }));
  expect(preview()).toBeNull();
  act(() => screen.getByRole("button", { name: "Delete row" }).focus());
  expect(preview()).toHaveStyle({ left: "100px", top: "100px", width: "400px", height: "40px" });
  expect(editor.getJSON()).toEqual(original);
  expect(editor.getHTML()).not.toContain("table-controls");
  expect(editor.getHTML()).not.toContain("table-action-preview");
});

it("menu items use the same previews and clear them on dismissal", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  select();
  mockGeometry();
  await user.click(screen.getByRole("button", { name: "Table settings" }));
  act(() => screen.getByRole("menuitem", { name: "Add row below" }).focus());
  expect(preview()).toHaveAttribute("data-action", "addRowAfter");
  expect(preview()).toHaveStyle({ top: "139px", width: "400px", height: "2px" });
  await user.keyboard("{Escape}");
  await waitFor(() => expect(preview()).toBeNull());
});

it("shows previews on touch-accessible cog actions and preserves outside focus for context menus", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  select();
  fireEvent.pointerDown(screen.getByRole("button", { name: "Table settings" }), { pointerType: "touch", button: 0 });
  expect(screen.getByRole("menuitem", { name: "Add row above" })).toBeInTheDocument();
  await user.keyboard("{Escape}");
  jest.spyOn(editor.view, "posAtCoords").mockReturnValue(null);
  fireEvent.contextMenu(cell(0), { clientX: 80, clientY: 100 });
  await user.click(screen.getByRole("button", { name: "Outside" }));
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
});

it("computed column widths never change serialized content", async () => {
  const width = jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600);
  try {
    render(<Harness />);
    const original = editor.getJSON();
    await waitFor(() => expect(editor.view.dom.querySelector("col")).toHaveStyle({ width: "300px" }));
    expect(editor.getJSON()).toEqual(original);
    expect(editor.getHTML()).not.toContain("300px");
  } finally {
    width.mockRestore();
  }
});

it("keeps a focused action's preview during a transaction that preserves the selection", () => {
  render(<Harness />);
  select();
  mockGeometry();
  act(() => screen.getByRole("button", { name: "Delete row" }).focus());
  act(() => editor.view.dispatch(editor.state.tr.setSelection(editor.state.selection)));
  expect(preview()).toHaveAttribute("data-action", "deleteRow");
});

it.each([false, true])(
  "uses wider mobile columns and recalculates on viewport resize (readonly: %s)",
  async (readonly) => {
    const originalViewport = window.innerWidth;
    const width = jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(280);
    try {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
      render(<Harness readonly={readonly} />);
      const original = editor.getJSON();
      await waitFor(() => expect(editor.view.dom.querySelector("col")).toHaveStyle({ width: "160px" }));
      expect(editor.view.dom.querySelector("table")).toHaveStyle({ width: "320px" });

      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
      fireEvent.resize(window);
      await waitFor(() => expect(editor.view.dom.querySelector("col")).toHaveStyle({ width: "140px" }));
      expect(editor.getJSON()).toEqual(original);
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalViewport });
      width.mockRestore();
    }
  },
);

it("offers deletion Undo until another edit makes it stale", async () => {
  const user = userEvent.setup();
  render(
    <>
      <Harness />
      <ToasterBar />
    </>,
  );
  select();
  const original = editor.getJSON();
  await user.click(screen.getByRole("button", { name: "Delete row" }));
  await user.click(within(screen.getByRole("status")).getByRole("button", { name: "Undo" }));
  await waitFor(() => expect(editor.getJSON()).toEqual(original));
  select();
  await user.click(screen.getByRole("button", { name: "Delete row" }));
  expect(screen.getByRole("status")).toBeInTheDocument();
  act(() => editor.commands.insertContent("Newer edit"));
  await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  expect(editor.getText()).toContain("Newer edit");
});

it.each([2, 3])("previews all %i rows covered by a legacy spanning cell before deleting", async (span) => {
  const user = userEvent.setup();
  render(<Harness />);
  const makeCell = (text: string, rowspan = 1) => ({
    type: "tableCell",
    attrs: { rowspan },
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });
  act(() =>
    editor.commands.setContent({
      type: "doc",
      content: [
        {
          type: "table",
          content: [0, 1, 2].map((row) => ({
            type: "tableRow",
            content:
              row === 0
                ? [makeCell("Merged", span), makeCell("First")]
                : row < span
                  ? [makeCell("Other")]
                  : [makeCell("Remaining"), makeCell("Last")],
          })),
        },
      ],
    }),
  );
  select();
  const rect = (top: number, height: number) => ({
    left: 100,
    right: 500,
    top,
    bottom: top + height,
    width: 400,
    height,
    x: 100,
    y: top,
    toJSON: () => ({}),
  });
  editor.view.dom
    .querySelectorAll("table, .tableWrapper")
    .forEach((node) => jest.spyOn(node, "getBoundingClientRect").mockReturnValue(rect(100, 120)));
  editor.view.dom
    .querySelectorAll("tr")
    .forEach((node, row) => jest.spyOn(node, "getBoundingClientRect").mockReturnValue(rect(100 + row * 40, 40)));
  jest.spyOn(cell(0), "getBoundingClientRect").mockReturnValue(rect(100, span * 40));
  fireEvent.pointerEnter(screen.getByRole("button", { name: "Delete row" }));
  expect(preview()).toHaveStyle({ top: "100px", height: `${span * 40}px`, width: "400px" });
  await user.click(screen.getByRole("button", { name: "Delete row" }));
  expect(editor.view.dom.querySelectorAll("tr")).toHaveLength(3 - span);
});

it.each([{ button: 2 }, { button: 0, ctrlKey: true }, { button: 0 }])(
  "ignores the opening gesture's release over a context-menu item: %j",
  async (pointer) => {
    const user = userEvent.setup();
    render(<Harness />);
    select();
    const original = editor.getJSON();
    jest.spyOn(editor.view, "posAtCoords").mockReturnValue(null);
    fireEvent.contextMenu(cell(0), { clientX: 80, clientY: 100 });
    const action = screen.getByRole("menuitem", { name: "Add row above" });
    fireEvent.pointerUp(action, pointer);
    expect(editor.getJSON()).toEqual(original);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(action);
    expect(editor.state.doc.firstChild?.childCount).toBe(3);
  },
);

it("requires a press on the same context-menu item before releasing", () => {
  render(<Harness />);
  select();
  const original = editor.getJSON();
  jest.spyOn(editor.view, "posAtCoords").mockReturnValue(null);
  fireEvent.contextMenu(cell(0), { clientX: 80, clientY: 100 });
  fireEvent.pointerDown(screen.getByRole("menuitem", { name: "Add column left" }), { button: 0 });
  fireEvent.pointerUp(screen.getByRole("menuitem", { name: "Add row above" }), { button: 0 });
  expect(editor.getJSON()).toEqual(original);
});

it.each(["keyboard", "touch"])("keeps deliberate context-menu activation working with %s", async (input) => {
  const user = userEvent.setup();
  render(<Harness />);
  select();
  jest.spyOn(editor.view, "posAtCoords").mockReturnValue(null);
  fireEvent.contextMenu(cell(0), { clientX: 80, clientY: 100 });
  const action = screen.getByRole("menuitem", { name: "Add row above" });
  if (input === "keyboard") {
    act(() => action.focus());
    await user.keyboard("{Enter}");
  } else {
    await user.pointer([{ keys: "[TouchA>]", target: action }, { keys: "[/TouchA]" }]);
  }
  expect(editor.state.doc.firstChild?.childCount).toBe(3);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});
