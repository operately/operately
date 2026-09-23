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
    // Mirror the editor option set in useEditor: keep input rules, disable
    // markdown paste conversion (except Highlight).
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

  it("converts H1 and H2 while typing", () => {
    const h1 = makeEditor();
    type(h1, "#", " ");
    expect(firstChild(h1)).toMatchObject({ type: "heading", attrs: { level: 1 } });

    const h2 = makeEditor();
    type(h2, "##", " ");
    expect(firstChild(h2)).toMatchObject({ type: "heading", attrs: { level: 2 } });
  });

  it("does not convert H3+ since no toolbar button exists", () => {
    const h3 = makeEditor();
    type(h3, "###", " ");
    expect(firstChild(h3).type).toBe("paragraph");
  });

  it("still renders existing H3+ content (schema keeps full heading levels)", () => {
    const editor = makeEditor();
    editor.commands.setContent({
      type: "doc",
      content: [{ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "deep" }] }],
    });
    // The H3+ input rule is disabled, but the schema must preserve existing
    // headings so stored content is not downcast to H1 on render.
    expect(firstChild(editor)).toMatchObject({ type: "heading", attrs: { level: 3 } });
    expect(editor.getHTML()).toContain("<h3>deep</h3>");
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
