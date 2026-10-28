import { Editor, type JSONContent } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import fixtures from "../../../../app/test/fixtures/rich_text/selections.json";
import { createRichEditorExtensions } from "../createRichEditorExtensions";
import { inlineCommentsKey, type InlineCommentsOptions } from "./InlineComments";

const content = (text: string): JSONContent => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
let editor: Editor;
afterEach(() => editor?.destroy());

function setup(options: Partial<InlineCommentsOptions> = {}, doc = content("Hello world")) {
  editor = new Editor({
    element: document.createElement("div"),
    extensions: createRichEditorExtensions(
      { uploadFile: async () => ({ id: "file", url: "https://example.com/file" }), peopleSearch: async () => [] },
      { inlineComments: { ranges: [{ id: "a", from: 1, to: 6 }], ...options } },
    ),
    content: doc,
  });
  return editor;
}
const ranges = () => inlineCommentsKey.getState(editor.state)?.ranges;

test("tracks boundary and interior insertions and partial deletion", () => {
  setup();
  editor.view.dispatch(editor.state.tr.insertText("Say ", 1));
  expect(ranges()).toEqual([{ id: "a", from: 5, to: 10 }]);
  editor.view.dispatch(editor.state.tr.insertText("!", 10));
  expect(ranges()).toEqual([{ id: "a", from: 5, to: 10 }]);
  editor.view.dispatch(editor.state.tr.insertText("XX", 7));
  expect(ranges()).toEqual([{ id: "a", from: 5, to: 12 }]);
  editor.view.dispatch(editor.state.tr.delete(7, 10));
  expect(ranges()).toEqual([{ id: "a", from: 5, to: 9 }]);
});

test("full replacement detaches, undo restores the exact snapshot, and redo detaches", () => {
  setup();
  editor.view.dispatch(editor.state.tr.insertText("Goodbye", 1, 6));
  expect(ranges()).toEqual([]);
  editor.commands.undo();
  expect(ranges()).toEqual([{ id: "a", from: 1, to: 6 }]);
  editor.commands.redo();
  expect(ranges()).toEqual([]);
});

test.each([
  { from: 1, to: 3, remaining: { id: "a", from: 1, to: 4 } },
  { from: 4, to: 6, remaining: { id: "a", from: 1, to: 4 } },
])("undo restores a partially deleted boundary ($from–$to), and redo shrinks it again", ({ from, to, remaining }) => {
  setup();
  editor.view.dispatch(editor.state.tr.delete(from, to));
  expect(ranges()).toEqual([remaining]);
  editor.commands.undo();
  expect(ranges()).toEqual([{ id: "a", from: 1, to: 6 }]);
  editor.commands.redo();
  expect(ranges()).toEqual([remaining]);
});

test("undo restores each boundary across successive partial and full deletions", () => {
  setup();
  editor.view.dispatch(editor.state.tr.delete(1, 2));
  editor.view.dispatch(closeHistory(editor.state.tr).delete(4, 5));
  editor.view.dispatch(closeHistory(editor.state.tr).delete(1, 4));
  expect(ranges()).toEqual([]);
  editor.commands.undo();
  expect(ranges()).toEqual([{ id: "a", from: 1, to: 4 }]);
  editor.commands.undo();
  expect(ranges()).toEqual([{ id: "a", from: 1, to: 5 }]);
  editor.commands.undo();
  expect(ranges()).toEqual([{ id: "a", from: 1, to: 6 }]);
  editor.commands.redo();
  editor.commands.redo();
  editor.commands.redo();
  expect(ranges()).toEqual([]);
});

test("undo recovers overlapping ranges after grouped partial deletions", () => {
  setup({
    ranges: [
      { id: "a", from: 1, to: 6 },
      { id: "b", from: 2, to: 5 },
    ],
  });
  editor.view.dispatch(editor.state.tr.delete(1, 2));
  editor.view.dispatch(editor.state.tr.delete(1, 2));
  editor.commands.undo();
  expect(ranges()).toEqual([
    { id: "a", from: 1, to: 6 },
    { id: "b", from: 2, to: 5 },
  ]);
});

test("supplied ranges discard partial-deletion recovery snapshots", () => {
  setup();
  editor.view.dispatch(editor.state.tr.delete(1, 3));
  editor.commands.setInlineCommentRanges([{ id: "new", from: 1, to: 4 }]);
  editor.commands.undo();
  expect(ranges()).toEqual([{ id: "new", from: 3, to: 6 }]);
});

test("supplied ranges start a new baseline and discard detached snapshots", () => {
  setup();
  editor.view.dispatch(editor.state.tr.delete(1, 6));
  editor.commands.setInlineCommentRanges([]);
  editor.commands.undo();
  expect(ranges()).toEqual([]);
});

test("overlapping highlights and active state stay out of document serialization", () => {
  setup({
    ranges: [
      { id: "a", from: 1, to: 6 },
      { id: "b", from: 4, to: 9 },
    ],
  });
  const json = editor.getJSON();
  const html = editor.getHTML();
  editor.commands.setActiveInlineThread("b");
  expect(editor.view.dom.querySelector('[data-inline-thread="b"]')?.className).toContain("bg-surface-highlight");
  expect(editor.getJSON()).toEqual(json);
  expect(editor.getHTML()).toBe(html);
  expect(html).not.toContain("inline-thread");
  expect(editor.view.serializeForClipboard(editor.state.doc.slice(1, 9)).dom.innerHTML).not.toContain("inline-thread");
});

test("reports selections and every thread at a clicked position", () => {
  const onSelectionChange = jest.fn();
  const onThreadClick = jest.fn();
  setup({
    ranges: [
      { id: "a", from: 1, to: 6 },
      { id: "b", from: 4, to: 9 },
    ],
    onSelectionChange,
    onThreadClick,
  });
  editor.commands.setTextSelection({ from: 1, to: 6 });
  expect(onSelectionChange).toHaveBeenLastCalledWith({ from: 1, to: 6, quote: "Hello" });
  editor.view.someProp("handleClick", (handler) => handler(editor.view, 4, new MouseEvent("click")));
  expect(onThreadClick).toHaveBeenCalledWith(["a", "b"]);
  editor.commands.setTextSelection(1);
  expect(onSelectionChange).toHaveBeenLastCalledWith(null);
});

test("uses UTF-16 positions and ignores formatting changes", () => {
  setup({ ranges: [{ id: "a", from: 4, to: 6 }] }, content("Hi 😀 friend"));
  editor.commands.setTextSelection({ from: 4, to: 6 });
  editor.commands.toggleBold();
  expect(ranges()).toEqual([{ id: "a", from: 4, to: 6 }]);
  editor.view.dispatch(editor.state.tr.insertText("👋 ", 1));
  expect(ranges()).toEqual([{ id: "a", from: 7, to: 9 }]);
});

test.each([3, 6])("external replacement discards the recovery baseline after deletion to %i", (to) => {
  setup();
  editor.view.dispatch(editor.state.tr.delete(1, to));
  editor.commands.setContent(content("Hello world"));
  expect(ranges()).toEqual([]);
  expect(inlineCommentsKey.getState(editor.state)?.snapshots).toEqual([]);
});

test("rejects ranges splitting a surrogate pair", () => {
  setup({ ranges: [{ id: "a", from: 2, to: 3 }] }, content("a😀b"));
  expect(ranges()).toEqual([]);
});

test.each(fixtures)("moves highlights through nested content: $name", (fixture) => {
  const initial = fixture.selections.map((selection, index) => ({
    id: String(index),
    from: selection.from,
    to: selection.to,
  }));
  setup({ ranges: initial }, fixture.content);
  editor.view.dispatch(editor.state.tr.insert(0, editor.schema.node("paragraph", null, editor.schema.text("👋"))));
  expect(ranges()).toEqual(initial.map((range) => ({ ...range, from: range.from + 4, to: range.to + 4 })));
});
