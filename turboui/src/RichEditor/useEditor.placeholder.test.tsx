import type { Editor } from "@tiptap/core";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useEditor } from "./useEditor";

const handlers = {
  mentionedPersonLookup: async () => null,
  resolveResourceLinks: null,
  uploadFile: async () => ({ id: "1", url: "https://example.com/file" }),
};

it("updates translated placeholders without replacing the editor or changing its content", async () => {
  const onUpdate = jest.fn();
  const { result, rerender } = renderHook(({ placeholder }) => useEditor({ handlers, placeholder, onUpdate }), {
    initialProps: { placeholder: "Write something" },
  });
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  const editor: Editor = result.current.editor;
  const placeholder = () => editor.view.dom.querySelector("p")?.getAttribute("data-placeholder");

  expect(placeholder()).toBe("Write something");
  rerender({ placeholder: "Schreibe etwas" });
  expect(result.current.editor).toBe(editor);
  expect(placeholder()).toBe("Schreibe etwas");
  expect(onUpdate).not.toHaveBeenCalled();

  act(() => {
    editor.commands.insertContent("Unsaved draft");
  });
  const content = editor.getJSON();
  const selection = editor.state.selection.toJSON();
  onUpdate.mockClear();

  rerender({ placeholder: "Write something" });
  expect(result.current.editor).toBe(editor);
  expect(editor.getJSON()).toEqual(content);
  expect(editor.state.selection.toJSON()).toEqual(selection);
  expect(onUpdate).not.toHaveBeenCalled();

  act(() => {
    editor.commands.undo();
  });
  expect(editor.isEmpty).toBe(true);
  expect(placeholder()).toBe("Write something");
});
