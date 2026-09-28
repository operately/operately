import type { Editor } from "@tiptap/core";
import { act, fireEvent, renderHook, waitFor } from "@testing-library/react";

import { useEditor } from "./useEditor";

const handlers = {
  mentionedPersonLookup: async () => null,
  uploadFile: async () => ({ id: "1", url: "https://example.com/file" }),
};
const resourceUrl = `${window.location.origin}/acme-0abc/projects/website-xyz`;
// JSDOM does not implement ClipboardEvent; pasteText/pasteHTML provide the clipboard content.
const pasteEvent = Object.assign(new Event("paste"), { clipboardData: null });

it.each([
  ["plain text", ""],
  ["HTML text", `<p>${resourceUrl}</p>`],
  ["text copied from an editor", `<p data-pm-slice="0 0 []">${resourceUrl}</p>`],
])("links a URL on a DOM paste event with %s", async (_format, html) => {
  const { editor, result, onUpdate } = await setup();

  fireEvent.paste(editor.view.dom, {
    clipboardData: {
      getData: (type: string) => ({ "text/html": html, "text/plain": resourceUrl })[type] ?? "",
      items: [],
      files: [],
    },
  });

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

it("keeps pasted Markdown literal while linking a neighboring plain URL", async () => {
  const { editor, result } = await setup();
  const markdown = '**bold** [label](https://example.com "Title")';

  act(() => {
    editor.view.pasteText(`${markdown} ${resourceUrl}`, pasteEvent);
  });

  expect(result.current.getJson().content[0].content).toEqual([
    { type: "text", text: `${markdown} ` },
    expect.objectContaining({ text: resourceUrl, marks: [expect.objectContaining({ type: "link" })] }),
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
