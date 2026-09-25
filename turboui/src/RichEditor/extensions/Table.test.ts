import { Editor, type JSONContent } from "@tiptap/core";
import { createRichEditorExtensions } from "../createRichEditorExtensions";
import { AddBlobsEditorCommand } from "../Blob/AddBlobsEditorCommand";
import { createDropFilePlugin } from "../Blob/DropFilePlugin";

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
