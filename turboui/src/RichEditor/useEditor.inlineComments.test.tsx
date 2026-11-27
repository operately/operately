import type { Editor } from "@tiptap/core";
import React from "react";
import { CellSelection } from "@tiptap/pm/tables";
import { act, render, renderHook, waitFor } from "@testing-library/react";
import { useEditor } from "./useEditor";
import { inlineCommentsKey } from "./extensions/InlineComments";
import { EditorContext, TipTapEditorContent } from "./EditorContext";
import { assertPresent } from "../utils/assertions";

const handlers = {
  mentionedPersonLookup: async () => null,
  resolveResourceLinks: null,
  uploadFile: async () => ({ id: "file", url: "https://example.com/file" }),
};
const content = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }] };

it("external content and supplied ranges replace the baseline; callback and active changes preserve local mapping", async () => {
  const onSelectionChange = jest.fn();
  const initialProps = { content, ranges: [{ id: "a", from: 1, to: 6 }], activeThreadId: "a", onSelectionChange };
  const { result, rerender } = renderHook(
    (props) =>
      useEditor({
        handlers,
        editable: false,
        content: props.content,
        inlineComments: {
          ranges: props.ranges,
          activeThreadId: props.activeThreadId,
          onSelectionChange: props.onSelectionChange,
        },
      }),
    { initialProps },
  );
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  const editor: Editor = result.current.editor;
  act(() => {
    editor.view.dispatch(editor.state.tr.insertText("Say ", 1));
  });
  const callback = jest.fn();
  rerender({ ...initialProps, activeThreadId: "b", onSelectionChange: callback });
  expect(inlineCommentsKey.getState(editor.state)?.ranges).toEqual([{ id: "a", from: 5, to: 10 }]);
  act(() => {
    editor.commands.setTextSelection({ from: 5, to: 10 });
  });
  expect(callback).toHaveBeenLastCalledWith({ from: 5, to: 10, quote: "Hello" });

  rerender({
    ...initialProps,
    content: { ...content, content: [{ type: "paragraph", content: [{ type: "text", text: "New body" }] }] },
    ranges: [{ id: "b", from: 1, to: 4 }],
  });
  expect(inlineCommentsKey.getState(editor.state)?.ranges).toEqual([{ id: "b", from: 1, to: 4 }]);
  expect(inlineCommentsKey.getState(editor.state)).not.toHaveProperty("snapshots");
});

it("local drafts contain only document content", async () => {
  const { result } = renderHook(() =>
    useEditor({
      handlers,
      content,
      localDraft: { key: "inline-test", enabled: true },
      inlineComments: { ranges: [{ id: "thread-id", from: 1, to: 6 }] },
    }),
  );
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  act(() => {
    result.current.editor.commands.insertContent("Draft ");
  });
  const draft = localStorage.getItem("operately:rich-text-draft:inline-test");
  expect(draft).toContain("Draft");
  expect(draft).not.toContain("thread-id");
  localStorage.removeItem("operately:rich-text-draft:inline-test");
});

it("can enable and disable decorations after loading threads without replacing the editor", async () => {
  const { result, rerender } = renderHook(
    ({ enabled }) =>
      useEditor({ handlers, content, inlineComments: enabled ? { ranges: [{ id: "a", from: 1, to: 6 }] } : undefined }),
    { initialProps: { enabled: false } },
  );
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  const editor: Editor = result.current.editor;
  expect(inlineCommentsKey.getState(editor.state)).toBeUndefined();
  rerender({ enabled: true });
  expect(result.current.editor).toBe(editor);
  expect(inlineCommentsKey.getState(editor.state)?.ranges).toEqual([{ id: "a", from: 1, to: 6 }]);
  rerender({ enabled: false });
  expect(inlineCommentsKey.getState(editor.state)).toBeUndefined();
});

it.each([true, false])("exposes working inline comment commands (initially enabled: %s)", async (enabled) => {
  const { result, rerender } = renderHook(
    ({ enabled }) => useEditor({ handlers, content, inlineComments: enabled ? { ranges: [] } : undefined }),
    { initialProps: { enabled } },
  );
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  const editor: Editor = result.current.editor;
  if (!enabled) rerender({ enabled: true });
  expect(result.current.editor).toBe(editor);

  act(() => {
    expect(editor.commands.setInlineCommentRanges([{ id: "a", from: 1, to: 6 }])).toBe(true);
    expect(editor.commands.setActiveInlineThread("a")).toBe(true);
  });
  expect(inlineCommentsKey.getState(editor.state)?.ranges).toEqual([{ id: "a", from: 1, to: 6 }]);
  expect(inlineCommentsKey.getState(editor.state)?.activeThreadId).toBe("a");
  expect(editor.view.dom.querySelector('[data-inline-thread="a"]')?.className).toContain("bg-yellow-200");

  act(() => {
    expect(
      editor
        .chain()
        .setInlineCommentRanges([{ id: "b", from: 7, to: 12 }])
        .setActiveInlineThread("b")
        .run(),
    ).toBe(true);
  });
  expect(inlineCommentsKey.getState(editor.state)?.ranges).toEqual([{ id: "b", from: 7, to: 12 }]);
  expect(inlineCommentsKey.getState(editor.state)?.activeThreadId).toBe("b");

  rerender({ enabled: false });
  expect(editor.can().setInlineCommentRanges([])).toBe(false);
  expect(editor.can().setActiveInlineThread("a")).toBe(false);
});

it("keeps a table selection and inline highlight usable through content unmount", async () => {
  const tableContent = {
    type: "doc",
    content: [
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: ["First cell", "Second cell"].map((text) => ({
              type: "tableCell",
              content: [{ type: "paragraph", content: [{ type: "text", text }] }],
            })),
          },
        ],
      },
    ],
  };
  const editorRef: { current: Editor | null } = { current: null };
  function Reader() {
    const state = useEditor({
      handlers,
      editable: false,
      content: tableContent,
      inlineComments: { ranges: [{ id: "thread", from: 4, to: 9 }] },
    });
    editorRef.current = state.editor;
    return <EditorContext.Provider value={state}>{state.editor && <TipTapEditorContent />}</EditorContext.Provider>;
  }

  const view = render(<Reader />);
  await waitFor(() => expect(view.container.querySelector(".ProseMirror")).not.toBeNull());
  expect(view.container.querySelector('[data-inline-thread="thread"]')).not.toBeNull();

  const cells: number[] = [];
  assertPresent(editorRef.current);
  const activeEditor = editorRef.current;
  activeEditor.state.doc.descendants((node, pos) => {
    if (node.type.name === "tableCell") cells.push(pos);
  });
  const firstCell = cells[0];
  assertPresent(firstCell);
  const savedContent = activeEditor.getJSON();
  act(() => {
    activeEditor.view.dispatch(
      activeEditor.state.tr.setSelection(CellSelection.create(activeEditor.state.doc, firstCell, firstCell)),
    );
  });
  expect(view.container.querySelector(".selectedCell")).not.toBeNull();
  expect(activeEditor.getJSON()).toEqual(savedContent);
  view.unmount();
});
