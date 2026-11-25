import type { Editor } from "@tiptap/core";
import { act, fireEvent, renderHook, waitFor } from "@testing-library/react";

import { useEditor } from "./useEditor";

const handlers = {
  mentionedPersonLookup: async () => null,
  resolveResourceLinks: null,
  uploadFile: async () => ({ id: "1", url: "https://example.com/file" }),
};
const resourceUrl = `${window.location.origin}/acme-0abc/projects/website-xyz`;
// JSDOM does not implement ClipboardEvent; pasteText/pasteHTML provide the clipboard content.
const pasteEvent = Object.assign(new Event("paste"), { clipboardData: null });

function pasteClipboard(editor: Editor, entries: Record<string, string>) {
  fireEvent.paste(editor.view.dom, {
    clipboardData: {
      getData: (type: string) => entries[type] ?? "",
      items: [],
      files: [],
    },
  });
}

it.each([
  ["plain text", ""],
  ["HTML text", `<p>${resourceUrl}</p>`],
  ["text copied from an editor", `<p data-pm-slice="0 0 []">${resourceUrl}</p>`],
])("links a URL on a DOM paste event with %s", async (_format, html) => {
  const { editor, result, onUpdate } = await setup();

  pasteClipboard(editor, { "text/html": html, "text/plain": resourceUrl });

  const json = result.current.getJson();
  expect(json.content[0].content).toMatchObject([
    { text: resourceUrl, marks: [{ type: "link", attrs: { href: resourceUrl } }] },
  ]);
  expect(onUpdate).toHaveBeenLastCalledWith({ json, html: editor.getHTML() });
});

async function setup() {
  const onUpdate = jest.fn();
  const { result } = renderHook(() => useEditor({ handlers, onUpdate }));
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  const editor: Editor = result.current.editor;

  return { editor, result, onUpdate };
}

it.each(["https://example.com", resourceUrl])("saves a pasted URL immediately as a link: %s", async (url) => {
  const { editor, result, onUpdate } = await setup();

  act(() => {
    editor.view.pasteText(url, pasteEvent);
  });

  const json = result.current.getJson();
  expect(json.content[0].content).toEqual([
    expect.objectContaining({
      text: url,
      marks: [expect.objectContaining({ type: "link", attrs: expect.objectContaining({ href: url }) })],
    }),
  ]);
  expect(onUpdate).toHaveBeenLastCalledWith({ json, html: editor.getHTML() });
  expect(editor.getHTML()).toContain(`href="${url}"`);
});

it("emits a link when a URL is entered without trailing whitespace", async () => {
  const url = "https://example.com/launch-plan";
  const { editor, result, onUpdate } = await setup();

  act(() => {
    editor.commands.insertContent(url);
  });

  const json = result.current.getJson();
  expect(json.content[0].content).toMatchObject([{ text: url, marks: [{ type: "link", attrs: { href: url } }] }]);
  expect(onUpdate).toHaveBeenLastCalledWith({ json, html: expect.any(String) });
});

it("links multiple URLs in pasted text, including the final word without whitespace", async () => {
  const { editor, result } = await setup();

  act(() => {
    editor.view.pasteText(`See https://example.com and ${resourceUrl}`, pasteEvent);
  });

  expect(result.current.getJson().content[0].content).toMatchObject([
    { text: "See " },
    { text: "https://example.com", marks: [{ type: "link", attrs: { href: "https://example.com" } }] },
    { text: " and " },
    { text: resourceUrl, marks: [{ type: "link", attrs: { href: resourceUrl } }] },
  ]);
});

it("pastes Markdown formatting and still links bare URLs", async () => {
  const { editor, result } = await setup();
  const markdown = "**bold** [label](https://example.com)";

  pasteClipboard(editor, { "text/plain": `${markdown} ${resourceUrl}` });

  expect(result.current.getJson().content[0].content).toMatchObject([
    { text: "bold", marks: [{ type: "bold" }] },
    { text: " " },
    { text: "label", marks: [{ type: "link", attrs: { href: "https://example.com" } }] },
    { text: " " },
    { text: resourceUrl, marks: [{ type: "link", attrs: { href: resourceUrl } }] },
  ]);
});

it.each([
  [
    "plain-text clipboard",
    { "text/plain": "## Plan\n\n**literal** ==literal==" },
    ["## Plan", "**literal** ==literal=="],
  ],
  [
    "VS Code Markdown clipboard",
    {
      "text/plain": "```mermaid\nflowchart TD\n```",
      "text/html": "<div>```mermaid<br>flowchart TD<br>```</div>",
      "vscode-editor-data": '{"mode":"markdown"}',
    },
    ["```mermaid", "flowchart TD", "```"],
  ],
])("keeps Markdown literal when using the plain-paste shortcut with a %s", async (_source, entries, lines) => {
  const { editor, result } = await setup();

  fireEvent.keyDown(editor.view.dom, { key: "v", code: "KeyV", keyCode: 86, ctrlKey: true, shiftKey: true });
  pasteClipboard(editor, entries);

  expect(result.current.getJson().content).toEqual(
    lines.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })),
  );
});

it("preserves literal Markdown and its code mark after enabling inline code at an empty cursor", async () => {
  const { editor, result } = await setup();
  act(() => {
    editor.commands.setCode();
  });

  pasteClipboard(editor, { "text/plain": "**literal**" });

  expect(result.current.getJson().content).toEqual([
    { type: "paragraph", content: [{ type: "text", text: "**literal**", marks: [{ type: "code" }] }] },
  ]);
});

it.each([
  ["plain text", {}],
  ["VS Code Markdown", { "vscode-editor-data": '{"mode":"markdown"}', "text/html": "<div>## Plan</div>" }],
])("pastes a Markdown document from %s as rich text blocks", async (_format, entries) => {
  const { editor, result } = await setup();
  const markdown = "## Plan\n\n- First\n- Second\n\n> A quote\n\n```js\n// **literal**\n```";

  pasteClipboard(editor, { "text/plain": markdown, ...entries });

  expect(result.current.getJson().content).toMatchObject([
    { type: "heading", attrs: { level: 2 }, content: [{ text: "Plan" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ text: "First" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ text: "Second" }] }] },
      ],
    },
    { type: "blockquote", content: [{ type: "paragraph", content: [{ text: "A quote" }] }] },
    { type: "codeBlock", attrs: { language: "js" }, content: [{ text: "// **literal**" }] },
    { type: "paragraph" },
  ]);
});

it("pastes ordinary text copied from a Markdown file as paragraphs", async () => {
  const { editor, result } = await setup();

  pasteClipboard(editor, { "text/plain": "First line\nSecond line", "vscode-editor-data": '{"mode":"markdown"}' });

  expect(result.current.getJson().content).toMatchObject([
    { type: "paragraph", content: [{ text: "First line" }] },
    { type: "paragraph", content: [{ text: "Second line" }] },
  ]);
});

it("preserves the language and text of code copied from VS Code", async () => {
  const { editor, result } = await setup();
  const source = 'const label = "**literal**";';

  pasteClipboard(editor, { "text/plain": source, "vscode-editor-data": '{"mode":"javascript"}' });

  expect(result.current.getJson().content[0]).toMatchObject({
    type: "codeBlock",
    attrs: { language: "javascript" },
    content: [{ text: source }],
  });
});

it("pastes Markdown source literally inside an existing code block", async () => {
  const { editor, result } = await setup();
  const source = "## Example\n\n**literal**";
  act(() => {
    editor.commands.setCodeBlock();
  });

  pasteClipboard(editor, { "text/plain": source });

  expect(result.current.getJson().content[0]).toMatchObject({
    type: "codeBlock",
    content: [{ text: source }],
  });
});

it("uses the HTML representation when the clipboard also includes Markdown-like text", async () => {
  const { editor, result } = await setup();

  pasteClipboard(editor, {
    "text/plain": "## Plain representation",
    "text/html": "<p><em>HTML representation</em></p>",
  });

  expect(result.current.getJson().content).toMatchObject([
    { type: "paragraph", content: [{ text: "HTML representation", marks: [{ type: "italic" }] }] },
  ]);
});

it("converts a pasted Mermaid fence into a diagram code block", async () => {
  const { editor, result } = await setup();
  const fence = "```";

  fireEvent.paste(editor.view.dom, {
    clipboardData: {
      getData: (type: string) => (type === "text/plain" ? `${fence}mermaid\nflowchart TD\n  A --> B\n${fence}` : ""),
      items: [],
      files: [],
    },
  });

  expect(result.current.getJson().content).toEqual([
    {
      type: "codeBlock",
      attrs: { language: "mermaid" },
      content: [{ type: "text", text: "flowchart TD\n  A --> B" }],
    },
    { type: "paragraph" },
  ]);
});

it.each(["codeBlock", "code"])("does not link URLs pasted into %s", async (type) => {
  const { editor, result } = await setup();

  act(() => {
    if (type === "codeBlock") {
      editor.commands.setCodeBlock();
    } else {
      editor.commands.setContent("<p><code>replace me</code></p>");
      editor.commands.setTextSelection({ from: 1, to: 11 });
    }
    editor.view.pasteText("https://example.com", pasteEvent);
  });

  expect(JSON.stringify(result.current.getJson())).not.toContain('"type":"link"');
  expect(editor.state.doc.firstChild?.textContent).toBe("https://example.com");
});

it("preserves custom labels in pasted HTML links", async () => {
  const { editor, result } = await setup();

  act(() => {
    editor.view.pasteHTML(`<a href="${resourceUrl}">Website</a>`, pasteEvent);
  });

  expect(result.current.getJson().content[0].content).toMatchObject([
    { text: "Website", marks: [{ type: "link", attrs: { href: resourceUrl } }] },
  ]);
});
