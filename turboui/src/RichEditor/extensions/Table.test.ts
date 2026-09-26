import { Editor, type JSONContent } from "@tiptap/core";
import { createRichEditorExtensions } from "../createRichEditorExtensions";
import { AddBlobsEditorCommand } from "../Blob/AddBlobsEditorCommand";
import { createDropFilePlugin } from "../Blob/DropFilePlugin";
import { closeHistory } from "@tiptap/pm/history";
import { CellSelection } from "@tiptap/pm/tables";
import { assertPresent } from "../../utils/assertions";

let editor: Editor;
const paste = (html: string) => editor.view.pasteHTML(html, Object.assign(new Event("paste"), { clipboardData: null }));
beforeEach(() => {
  editor = new Editor({
    element: document.createElement("div"),
    extensions: createRichEditorExtensions({}, { editable: false }),
  });
  editor.setEditable(true);
});
afterEach(() => editor.destroy());

it("keeps only the first row as headers when inserting above or deleting the header", () => {
  editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
  const saved = editor.getJSON();
  editor.view.dispatch(closeHistory(editor.state.tr));
  editor.commands.addRowBefore();
  expect(editor.view.dom.querySelectorAll("tr")).toHaveLength(4);
  expect(editor.view.dom.querySelectorAll("th")).toHaveLength(3);
  expect(editor.view.dom.querySelector("tr")?.querySelectorAll("th")).toHaveLength(3);
  editor.commands.undo();
  expect(editor.getJSON()).toEqual(saved);
  editor.commands.setTextSelection(4);
  editor.commands.deleteRow();
  expect(editor.view.dom.querySelectorAll("tr")).toHaveLength(2);
  expect(editor.view.dom.querySelector("tr")?.querySelectorAll("th")).toHaveLength(3);
});

it("toggles the first header row from any cell, including a one-cell table", () => {
  editor.commands.insertTable({ rows: 1, cols: 1, withHeaderRow: true });
  editor.commands.toggleHeaderRow();
  expect(editor.view.dom.querySelectorAll("th")).toHaveLength(0);
  editor.commands.toggleHeaderRow();
  expect(editor.view.dom.querySelectorAll("th")).toHaveLength(1);
});

it.each(["deleteRow", "deleteColumn"] as const)(
  "%s removes the final row/column and leaves a usable cursor",
  (command) => {
    editor.commands.insertTable({ rows: 1, cols: 1 });
    expect(editor.can()[command]()).toBe(true);
    editor.commands[command]();
    expect(editor.view.dom.querySelector("table")).toBeNull();
    editor.commands.insertContent("After");
    expect(editor.getText()).toContain("After");
  },
);

it.each(["deleteRow", "deleteColumn"] as const)("%s removes a selection covering every row/column", (command) => {
  editor.commands.insertTable({ rows: 2, cols: 2 });
  const cells: number[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (["tableCell", "tableHeader"].includes(node.type.name)) cells.push(pos);
  });
  const first = cells[0];
  const last = cells[3];
  assertPresent(first);
  assertPresent(last);
  editor.view.dispatch(editor.state.tr.setSelection(CellSelection.create(editor.state.doc, first, last)));
  expect(editor.can()[command]()).toBe(true);
  editor.commands[command]();
  expect(editor.view.dom.querySelector("table")).toBeNull();
});

it("keeps headerless tables headerless during row and column changes", () => {
  editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: false });
  editor.commands.addRowBefore();
  editor.commands.addRowAfter();
  editor.commands.addColumnBefore();
  editor.commands.addColumnAfter();
  expect(editor.view.dom.querySelectorAll("tr")).toHaveLength(4);
  expect(editor.view.dom.querySelectorAll("td")).toHaveLength(16);
  expect(editor.view.dom.querySelectorAll("th")).toHaveLength(0);
  editor.commands.goToNextCell();
  editor.commands.goToNextCell();
  editor.commands.goToNextCell();
  editor.commands.goToNextCell();
  editor.commands.toggleHeaderRow();
  expect(editor.view.dom.querySelector("tr")?.querySelectorAll("th")).toHaveLength(4);
  expect(editor.view.dom.querySelectorAll("th")).toHaveLength(4);
});

it("navigates cells in both directions and adds a body row after the last header cell", () => {
  // Dispatch real key events; Tiptap's keyboardShortcut helper copies document steps only, not selection changes.
  const tab = (shiftKey = false) =>
    editor.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", shiftKey, bubbles: true, cancelable: true }),
    );
  editor.commands.insertTable({ rows: 1, cols: 2, withHeaderRow: true });
  const first = editor.state.selection.from;
  tab();
  const second = editor.state.selection.from;
  expect(second).toBeGreaterThan(first);
  tab(true);
  expect(editor.state.selection.from).toBe(first);
  tab();
  tab();
  expect(editor.view.dom.querySelectorAll("tr")).toHaveLength(2);
  expect(editor.view.dom.querySelectorAll("th")).toHaveLength(2);
  expect(editor.state.selection.$from.node(-1).type.name).toBe("tableCell");
});

const paragraph = (text: string): JSONContent => ({ type: "paragraph", content: [{ type: "text", text }] });
const cell = (text: string, attrs = {}): JSONContent => ({ type: "tableCell", attrs, content: [paragraph(text)] });
const row = (...content: JSONContent[]): JSONContent => ({ type: "tableRow", content });
const attachmentTable: JSONContent = {
  type: "table",
  content: [
    row({
      type: "tableCell",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Original" },
            { type: "blob", attrs: { src: "/file.pdf", title: "File", status: "uploaded" } },
          ],
        },
      ],
    }),
  ],
};
const legacyTables: [string, JSONContent][] = [
  ["column widths", { type: "table", content: [row(cell("Original", { colwidth: [120] }))] }],
  ["column spans", { type: "table", content: [row(cell("Original", { colspan: 2 })), row(cell("B"), cell("C"))] }],
  ["row spans", { type: "table", content: [row(cell("Original", { rowspan: 2 }), cell("B")), row(cell("C"))] }],
  ["attachments", attachmentTable],
];

function mountLegacyTable(table: JSONContent) {
  editor.destroy();
  editor = new Editor({
    element: document.createElement("div"),
    extensions: createRichEditorExtensions({}, { editable: false }),
    content: { type: "doc", content: [table, { type: "paragraph" }] },
  });
}

it.each(legacyTables)("allows text edits in stored tables with %s", (_name, table) => {
  mountLegacyTable(table);
  const original = editor.getJSON();
  editor.commands.setTextSelection(4);
  editor.commands.insertContent("Updated ");
  expect(editor.getText()).toContain("Updated Original");
  expect(editor.getJSON()).toEqual(JSON.parse(JSON.stringify(original).replace('"Original"', '"Updated Original"')));
  editor.commands.undo();
  expect(editor.getJSON()).toEqual(original);
  editor.commands.redo();
  expect(editor.getText()).toContain("Updated Original");
});

it.each(legacyTables)("loads and refreshes stored tables with %s in read-only mode", (_name, table) => {
  editor.setEditable(false);
  const content = { type: "doc", content: [table] };
  editor.commands.setContent(content, { emitUpdate: false });
  expect(editor.getText()).toContain("Original");
  editor.commands.setContent(JSON.parse(JSON.stringify(content).replace('"Original"', '"Refreshed"')), {
    emitUpdate: false,
  });
  expect(editor.getText()).toContain("Refreshed");
  expect(editor.getText()).not.toContain("Original");
});

it.each(legacyTables)("restores a deleted table with %s on undo", (_name, table) => {
  mountLegacyTable(table);
  const saved = editor.getJSON();
  editor.commands.setTextSelection(4);
  editor.commands.deleteTable();
  expect(editor.view.dom.querySelector("table")).toBeNull();
  editor.commands.undo();
  expect(editor.getJSON()).toEqual(saved);
});

it("rejects new attachments inside a table that already contains one", () => {
  mountLegacyTable(attachmentTable);
  const saved = editor.getJSON();
  editor.commands.setTextSelection(4);
  editor.commands.insertContent({ type: "blob", attrs: { src: "/new.pdf", title: "New" } });
  expect(editor.getJSON()).toEqual(saved);
  editor.commands.insertContent({ type: "blob", attrs: { src: "/file.pdf", title: "File", status: "uploaded" } });
  expect(editor.getJSON()).toEqual(saved);
});

it.each([{ colspan: 2 }, { rowspan: 2 }, { colwidth: [120] }])(
  "rejects new unsupported cell attributes: %p",
  (attrs) => {
    editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: false });
    const saved = editor.getJSON();
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(2, undefined, { colspan: 1, rowspan: 1, colwidth: null, ...attrs }),
    );
    expect(editor.getJSON()).toEqual(saved);
  },
);

it("pastes a table, preserves it across JSON reload, and supports undo/redo", () => {
  paste(
    "<p>Before</p><table><tr><th>Name</th><th>Notes</th></tr><tr><td>Alice</td><td><strong>Ready</strong></td></tr></table><p>After</p>",
  );
  const saved = editor.getJSON();
  expect(saved.content?.map((node) => node.type)).toEqual(["paragraph", "table", "paragraph"]);
  expect(editor.view.dom.querySelectorAll("td")).toHaveLength(2);
  expect(editor.commands.undo()).toBe(true);
  expect(editor.view.dom.querySelector("table")).toBeNull();
  expect(editor.commands.redo()).toBe(true);
  expect(editor.getJSON()).toEqual(saved);
  editor.commands.setContent(saved);
  expect(editor.getJSON()).toEqual(saved);
  expect(editor.view.dom.querySelector(".tableWrapper")).not.toBeNull();
});

it("normalizes merged HTML cells before schema parsing", () => {
  paste('<table><tr><td colspan="2">A</td><td>B</td></tr><tr><td>C</td></tr></table>');
  const content: JSONContent = editor.getJSON();
  const rows = content.content?.find((node) => node.type === "table")?.content ?? [];
  expect(rows.map((row) => row.content?.length)).toEqual([3, 3]);
  expect(editor.view.dom.querySelectorAll("td[colspan='2']")).toHaveLength(0);
});

it("prevents nested tables, headings, lists and new attachment nodes inside cells", () => {
  editor.commands.insertTable({ rows: 1, cols: 1 });
  const saved = editor.getJSON();
  expect(editor.can().insertTable()).toBe(false);
  expect(editor.can().toggleHeading({ level: 1 })).toBe(false);
  expect(editor.can().toggleBulletList()).toBe(false);
  editor.commands.insertContent({ type: "blob", attrs: { src: "/file.pdf", title: "File" } });
  expect(editor.getJSON()).toEqual(saved);
  const uploadFile = jest.fn();
  expect(
    AddBlobsEditorCommand({
      files: [new File(["File"], "file.pdf")],
      pos: editor.state.selection.from,
      view: editor.view,
      uploadFile,
    }),
  ).toBe(false);
  expect(uploadFile).not.toHaveBeenCalled();
});

it("allows HTML drops through and prevents file uploads into cells", () => {
  editor.commands.insertTable({ rows: 1, cols: 1 });
  const saved = editor.getJSON();
  const uploadFile = jest.fn();
  const plugin = createDropFilePlugin(uploadFile);
  jest.spyOn(editor.view, "posAtCoords").mockReturnValue({ pos: editor.state.selection.from, inside: 0 });
  const drop = (files: File[]) => {
    const event = new MouseEvent("drop", { cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { files } });
    return event as DragEvent;
  };
  expect(plugin.props.handleDOMEvents?.drop?.call(plugin, editor.view, drop([]))).toBe(false);
  const fileDrop = drop([new File(["File"], "file.pdf")]);
  expect(plugin.props.handleDOMEvents?.drop?.call(plugin, editor.view, fileDrop)).toBe(true);
  expect(fileDrop.defaultPrevented).toBe(true);
  expect(uploadFile).not.toHaveBeenCalled();
  expect(editor.getJSON()).toEqual(saved);
});

it("flattens a table pasted within a cell without dropping its text", () => {
  editor.commands.insertTable({ rows: 1, cols: 1 });
  paste("<table><tr><td>One</td><td>Two</td></tr></table>");
  expect(editor.view.dom.querySelectorAll("table")).toHaveLength(1);
  expect(editor.view.dom.textContent).toContain("One | Two");
});

it("flattens blocks and images pasted into an existing cell", () => {
  editor.commands.insertTable({ rows: 1, cols: 1, withHeaderRow: false });
  paste('<h2>Heading</h2><ul><li>One</li><li><em>Two</em></li></ul><img src="/diagram.png" alt="Diagram">');
  const cell = editor.view.dom.querySelector("td");
  expect(cell?.textContent).toBe("HeadingOneTwoDiagram");
  expect(cell?.querySelector("em")?.textContent).toBe("Two");
  expect(cell?.querySelector("a")?.getAttribute("href")).toBe("/diagram.png");
  expect(editor.view.dom.querySelectorAll("h2, ul, li, img")).toHaveLength(0);
});

it("uses native table navigation and does not change read-only content on Tab", () => {
  editor.commands.insertTable({ rows: 1, cols: 1 });
  editor.commands.keyboardShortcut("Tab");
  expect(editor.view.dom.querySelectorAll("tr")).toHaveLength(2);
  const saved = editor.getJSON();
  editor.setEditable(false);
  editor.commands.keyboardShortcut("Tab");
  expect(editor.getJSON()).toEqual(saved);
  expect(editor.view.dom.querySelector(".tableWrapper")?.getAttribute("tabindex")).toBe("0");
});
