import { Editor } from "@tiptap/core";
import { createRichEditorExtensions } from "./createRichEditorExtensions";
import { setTaskItemChecked } from "./taskLists";

const document = {
  type: "doc",
  content: [
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Ship it" }] }],
        },
      ],
    },
  ],
};

describe("task lists", () => {
  it("preserves task items and checked state through the shared editor schema", () => {
    const editor = new Editor({ extensions: createRichEditorExtensions({}), content: document });
    expect(editor.getJSON().content?.[0]?.content?.[0]).toMatchObject({ attrs: { checked: false } });
    expect(editor.getText().trim()).toBe("Ship it");
    editor.destroy();
  });

  it("changes only the selected checkbox without mutating the source", () => {
    const updated = setTaskItemChecked(document, [0, 0], true);
    expect(updated.content?.[0]?.content?.[0]?.attrs).toEqual({ checked: true });
    expect(document.content[0]?.content[0]?.attrs.checked).toBe(false);
    expect(updated.content?.[0]?.content?.[0]?.content).toEqual(document.content[0]?.content[0]?.content);
  });

  it("rejects paths that do not identify a task item", () => {
    expect(() => setTaskItemChecked(document, [0], true)).toThrow();
    expect(() => setTaskItemChecked(document, [-1], true)).toThrow();
  });
});

it("converts lists, indents task items, and supports undo and redo", () => {
  const editor = new Editor({ extensions: createRichEditorExtensions({}), content: "<p>First</p><p>Second</p>" });
  editor.commands.selectAll();
  editor.commands.toggleTaskList();
  expect(editor.getJSON().content?.[0]?.type).toBe("taskList");
  editor.commands.setTextSelection(12);
  expect(editor.commands.sinkListItem("taskItem")).toBe(true);
  expect(JSON.stringify(editor.getJSON()).match(/taskList/g)).toHaveLength(2);
  editor.commands.undo();
  expect(editor.getJSON().content?.[0]?.type).toBe("paragraph");
  editor.commands.redo();
  expect(JSON.stringify(editor.getJSON()).match(/taskList/g)).toHaveLength(2);
  editor.destroy();
});

it.each([
  ["[ ]", false],
  ["[x]", true],
] as const)("supports typing %s followed by a space", (shortcut, checked) => {
  const editor = new Editor({ extensions: createRichEditorExtensions({}), content: `<p>${shortcut}</p>` });
  const position = shortcut.length + 1;
  editor.commands.setTextSelection(position);
  editor.view.someProp("handleTextInput", (handler) =>
    handler(editor.view, position, position, " ", () => editor.state.tr),
  );
  expect(editor.getJSON().content?.[0]?.type).toBe("taskList");
  expect(editor.getJSON().content?.[0]?.content?.[0]).toMatchObject({ attrs: { checked } });
  editor.destroy();
});
