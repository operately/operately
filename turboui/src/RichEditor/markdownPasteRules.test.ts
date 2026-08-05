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
    // Mirror the editor option set in useEditor.
    enablePasteRules: ["highlight", "bold", "italic", "strike", "link", "markdownBlockPasteRules"],
  });
}

// Simulate a clipboard paste of raw text into an empty document, which is how
// ProseMirror paste rules fire in the running editor.
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

describe("RichEditor markdown paste rules", () => {
  it("converts inline marks on paste", () => {
    const bold = makeEditor();
    paste(bold, "**bold**");
    expect(firstText(bold).marks).toEqual([{ type: "bold" }]);
    expect(firstText(bold).text).toBe("bold");

    const italic = makeEditor();
    paste(italic, "*italic*");
    expect(firstText(italic).marks).toEqual([{ type: "italic" }]);

    const strike = makeEditor();
    paste(strike, "~~strike~~");
    expect(firstText(strike).marks).toEqual([{ type: "strike" }]);
  });

  it("converts a markdown link on paste", () => {
    const editor = makeEditor();
    paste(editor, "[label](https://example.com)");
    const text = firstText(editor);
    expect(text.text).toBe("label");
    expect(text.marks?.[0]).toMatchObject({ type: "link", attrs: { href: "https://example.com" } });
  });

  it("converts H1 and H2 on paste", () => {
    const h1 = makeEditor();
    paste(h1, "# Heading");
    expect(firstChild(h1)).toMatchObject({ type: "heading", attrs: { level: 1 } });
    expect(firstText(h1).text).toBe("Heading");

    const h2 = makeEditor();
    paste(h2, "## Heading");
    expect(firstChild(h2)).toMatchObject({ type: "heading", attrs: { level: 2 } });
  });

  it("does not convert H3+ on paste (no toolbar button, matching typing)", () => {
    const h3 = makeEditor();
    paste(h3, "### Heading");
    expect(firstChild(h3).type).toBe("paragraph");
  });

  it("converts blockquote, lists and code block on paste", () => {
    const quote = makeEditor();
    paste(quote, "> quote");
    expect(firstChild(quote).type).toBe("blockquote");

    const bullet = makeEditor();
    paste(bullet, "- item");
    expect(firstChild(bullet).type).toBe("bulletList");

    const bulletStar = makeEditor();
    paste(bulletStar, "* item");
    expect(firstChild(bulletStar).type).toBe("bulletList");

    const ordered = makeEditor();
    paste(ordered, "1. item");
    expect(firstChild(ordered).type).toBe("orderedList");

    const code = makeEditor();
    paste(code, "```js const x = 1;");
    expect(firstChild(code).type).toBe("codeBlock");
  });

  it("preserves existing Highlight paste behavior", () => {
    const editor = makeEditor();
    paste(editor, "==hl==");
    expect(firstText(editor).marks?.[0].type).toBe("highlight");
  });

  it("does not convert markdown nested inside a pasted fenced code block", () => {
    const editor = makeEditor();
    paste(editor, "```js const label = '**not bold**';");
    const block = firstChild(editor);
    expect(block.type).toBe("codeBlock");
    // The `**not bold**` inside the code block stays literal (code blocks
    // disallow marks and paste rules skip code nodes).
    expect(block.content?.[0].text).toContain("**not bold**");
    expect(block.content?.[0].marks).toBeUndefined();
  });
});
