import { Editor } from "@tiptap/core";

import { createRichEditorExtensions } from "./createRichEditorExtensions";

const handlers = {
  mentionedPersonLookup: async () => null,
  uploadFile: async () => ({ id: "1", url: "u" }),
} as any;

function makeEditor(): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: createRichEditorExtensions(handlers, { editable: true }),
    // Mirror useEditor: preserve Highlight on paste; Link handles clipboard parsing.
    enablePasteRules: ["highlight"],
  });
}

// Simulate typing `lastChar` at the end of `before`, which is how ProseMirror
// input rules fire in the running editor.
function type(editor: Editor, before: string, lastChar: string): void {
  editor.commands.setContent({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: before }] }],
  });
  editor.commands.setTextSelection(editor.state.doc.content.size - 1);
  const { from } = editor.state.selection;
  editor.view.someProp("handleTextInput", (fn: any) => fn(editor.view, from, from, lastChar));
}

// Simulate a clipboard paste of raw text.
function paste(editor: Editor, text: string): void {
  editor.commands.setContent({ type: "doc", content: [{ type: "paragraph" }] });
  const tr = editor.state.tr.insertText(text, 1);
  tr.setMeta("uiEvent", "paste");
  editor.view.dispatch(tr);
}

function firstChild(editor: Editor): any {
  return editor.getJSON().content?.[0];
}

function firstText(editor: Editor): any {
  return firstChild(editor)?.content?.[0];
}

describe("RichEditor markdown input rules", () => {
  it("converts inline marks while typing", () => {
    const bold = makeEditor();
    type(bold, "**bold*", "*");
    expect(firstText(bold).marks).toEqual([{ type: "bold" }]);
    expect(firstText(bold).text).toBe("bold");

    const italic = makeEditor();
    type(italic, "*italic", "*");
    expect(firstText(italic).marks).toEqual([{ type: "italic" }]);

    const strike = makeEditor();
    type(strike, "~~strike~", "~");
    expect(firstText(strike).marks).toEqual([{ type: "strike" }]);
  });

  it.each([1, 2, 3, 4])("converts H%i while typing", (level) => {
    const editor = makeEditor();
    type(editor, "#".repeat(level), " ");
    expect(firstChild(editor)).toMatchObject({ type: "heading", attrs: { level } });
    expect(editor.state.doc.textContent).toBe("");
    editor.destroy();
  });

  it.each([5, 6])("does not convert H%i while typing", (level) => {
    const editor = makeEditor();
    type(editor, "#".repeat(level), " ");
    expect(firstChild(editor).type).toBe("paragraph");
    expect(editor.state.doc.textContent).toBe("#".repeat(level));
    editor.destroy();
  });

  it.each([1, 2, 3, 4, 5, 6])("preserves existing H%i content when rendering and serializing", (level) => {
    const editor = makeEditor();
    editor.commands.setContent({
      type: "doc",
      content: [{ type: "heading", attrs: { level }, content: [{ type: "text", text: "Heading" }] }],
    });
    expect(firstChild(editor)).toMatchObject({ type: "heading", attrs: { level } });
    expect(editor.getHTML()).toContain(`<h${level}>Heading</h${level}>`);
    editor.destroy();
  });

  it.each([2, 3, 4])("toggles H%i with its keyboard shortcut", (level) => {
    const editor = makeEditor();
    editor.commands.keyboardShortcut(`Mod-Alt-${level}`);
    expect(firstChild(editor)).toMatchObject({ type: "heading", attrs: { level } });
    editor.commands.keyboardShortcut(`Mod-Alt-${level}`);
    expect(firstChild(editor).type).toBe("paragraph");
    editor.destroy();
  });

  it.each([1, 5, 6])("does not create H%i with a keyboard shortcut", (level) => {
    const editor = makeEditor();
    editor.commands.keyboardShortcut(`Mod-Alt-${level}`);
    expect(firstChild(editor).type).toBe("paragraph");
    editor.destroy();
  });

  it("converts lists, blockquote and code block while typing", () => {
    const bullet = makeEditor();
    type(bullet, "-", " ");
    expect(firstChild(bullet).type).toBe("bulletList");

    const bulletStar = makeEditor();
    type(bulletStar, "*", " ");
    expect(firstChild(bulletStar).type).toBe("bulletList");

    const ordered = makeEditor();
    type(ordered, "1.", " ");
    expect(firstChild(ordered).type).toBe("orderedList");

    const quote = makeEditor();
    type(quote, ">", " ");
    expect(firstChild(quote).type).toBe("blockquote");

    const code = makeEditor();
    type(code, "```", " ");
    expect(firstChild(code).type).toBe("codeBlock");
  });

  it("converts a markdown link while typing", () => {
    const editor = makeEditor();
    type(editor, "[label](https://example.com", ")");
    const text = firstText(editor);
    expect(text.text).toBe("label");
    expect(text.marks?.[0]).toMatchObject({ type: "link", attrs: { href: "https://example.com" } });
  });

  it("keeps pasted markdown literal", () => {
    const bold = makeEditor();
    paste(bold, "**bold**");
    expect(firstText(bold)).toEqual({ type: "text", text: "**bold**" });

    const link = makeEditor();
    paste(link, "[label](https://example.com)");
    expect(firstText(link)).toEqual({ type: "text", text: "[label](https://example.com)" });
  });

  it("preserves existing Highlight behavior", () => {
    const typed = makeEditor();
    type(typed, "==hl=", "=");
    expect(firstText(typed).marks?.[0].type).toBe("highlight");

    const pasted = makeEditor();
    paste(pasted, "==hl==");
    expect(firstText(pasted).marks?.[0].type).toBe("highlight");
  });
});
