import { act, renderHook, waitFor } from "@testing-library/react";
import { useEditor } from "./useEditor";

const href = `${window.location.origin}/acme-0abc/projects/website-xyz`;
const content = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Website",
          marks: [
            {
              type: "link",
              attrs: {
                href,
                operatelyResourceLink: { originalText: href, resolvedText: "Website" },
              },
            },
          ],
        },
      ],
    },
  ],
};
const handlers = { mentionedPersonLookup: async () => null, resolveResourceLinks: null };

it("renders backend titles without requesting resources", async () => {
  const { result } = renderHook(() => useEditor({ content, editable: false, handlers }));
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  expect(result.current.getJson().content[0].content[0].text).toBe("Website");
  expect(result.current.getJson().content[0].content[0].marks[0].attrs.href).toBe(href);
});

it("restores editable source before initialization and setContent without persisting metadata", async () => {
  const { result } = renderHook(() => useEditor({ content, editable: true, handlers }));
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  expect(result.current.getJson().content[0].content[0].text).toBe(href);
  expect(JSON.stringify(result.current.getJson())).not.toContain("operatelyResourceLink");
  act(() => result.current.setContent(content));
  expect(result.current.getJson().content[0].content[0].text).toBe(href);
  expect(content.content[0]?.content[0]?.text).toBe("Website");
});

it("synchronizes read-only content on subsequent backend responses", async () => {
  const { result, rerender } = renderHook(({ value }) => useEditor({ content: value, editable: false, handlers }), {
    initialProps: { value: content },
  });
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  const next = JSON.parse(JSON.stringify(content));
  next.content[0].content[0].text = "Renamed";
  rerender({ value: next });
  await waitFor(() => expect(result.current.getJson().content[0].content[0].text).toBe("Renamed"));
});

it("shows pasted link titles but submits URL labels without metadata", async () => {
  const resolveResourceLinks = jest.fn().mockResolvedValue([{ url: href, title: "Website" }]);
  const { result } = renderHook(() => useEditor({ handlers: { ...handlers, resolveResourceLinks } }));
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  act(() => result.current.editor.view.pasteText(href, Object.assign(new Event("paste"), { clipboardData: null })));
  expect(result.current.editor.state.doc.textContent).toBe(href);
  expect(result.current.submittable).toBe(true);
  await waitFor(() => expect(result.current.editor.state.doc.textContent).toBe("Website"));
  expect(resolveResourceLinks).toHaveBeenCalledWith([href]);
  expect(result.current.getJson().content[0].content[0].text).toBe(href);
  expect(result.current.editor.getJSON().content[0].content[0].marks[0].attrs.operatelyResourceLink).toEqual({
    originalText: href,
    resolvedText: "Website",
  });
  expect(JSON.stringify(result.current.getJson())).not.toContain("operatelyResourceLink");
  expect(result.current.getJson().content[0].content[0].marks[0].attrs.href).toBe(href);
});

it("does not overwrite a label edited while the lookup is pending", async () => {
  let finish: (links: { url: string; title: string }[]) => void = () => {};
  const resolveResourceLinks = jest.fn(
    () =>
      new Promise<{ url: string; title: string }[]>((resolve) => {
        finish = resolve;
      }),
  );
  const { result } = renderHook(() => useEditor({ content, handlers: { ...handlers, resolveResourceLinks } }));
  await waitFor(() => expect(resolveResourceLinks).toHaveBeenCalled());
  act(() => result.current.editor.commands.insertContentAt({ from: 1, to: href.length + 1 }, "Custom"));
  await act(async () => finish([{ url: href, title: "Website" }]));
  expect(result.current.editor.state.doc.textContent).toBe("Custom");
});

it("emits source URLs and restores drafts using the current viewer's permissions", async () => {
  const resolveResourceLinks = jest.fn().mockResolvedValue([{ url: href, title: "Website" }]);
  const onUpdate = jest.fn();
  const localDraft = { key: "permission-aware-link" };
  const { result, unmount } = renderHook(() =>
    useEditor({ localDraft, onUpdate, handlers: { ...handlers, resolveResourceLinks } }),
  );
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  act(() => result.current.editor.view.pasteText(href, Object.assign(new Event("paste"), { clipboardData: null })));
  await waitFor(() => expect(result.current.editor.state.doc.textContent).toBe("Website"));
  expect(onUpdate.mock.lastCall[0].json.content[0].content[0].text).toBe(href);
  const savedDraft = localStorage.getItem("operately:rich-text-draft:permission-aware-link");
  expect(savedDraft).not.toContain("Website");
  expect(savedDraft).not.toContain("operatelyResourceLink");
  unmount();

  const deniedLookup = jest.fn().mockResolvedValue([]);
  const restored = renderHook(() =>
    useEditor({ localDraft, handlers: { ...handlers, resolveResourceLinks: deniedLookup } }),
  );
  await waitFor(() => expect(deniedLookup).toHaveBeenCalledWith([href]));
  expect(restored.result.current.localDraftRestored).toBe(true);
  expect(restored.result.current.editor.state.doc.textContent).toBe(href);
  restored.result.current.clearLocalDraft();
});

it("preserves deliberately customized labels after resolution", async () => {
  const resolveResourceLinks = jest.fn().mockResolvedValue([{ url: href, title: "Website" }]);
  const { result } = renderHook(() => useEditor({ content, handlers: { ...handlers, resolveResourceLinks } }));
  await waitFor(() => expect(result.current.editor.state.doc.textContent).toBe("Website"));
  act(() => result.current.editor.commands.insertContentAt({ from: 1, to: 8 }, "My label"));
  expect(result.current.getJson().content[0].content[0].text).toBe("My label");
  expect(JSON.stringify(result.current.getJson())).not.toContain("operatelyResourceLink");
});

it("does not turn a generated title into saved text when formatting splits it", async () => {
  const resolveResourceLinks = jest.fn().mockResolvedValue([{ url: href, title: "Website" }]);
  const { result } = renderHook(() => useEditor({ content, handlers: { ...handlers, resolveResourceLinks } }));
  await waitFor(() => expect(result.current.editor.state.doc.textContent).toBe("Website"));
  act(() => result.current.editor.chain().setTextSelection({ from: 1, to: 4 }).toggleBold().run());
  const saved = result.current.getJson();
  expect(saved.content[0].content.map((node: { text: string }) => node.text).join("")).toBe(href);
  expect(JSON.stringify(saved)).not.toContain("Website");
});

function sourceDocument(urls: string[], label?: string) {
  return {
    type: "doc",
    content: urls.map((url) => ({
      type: "paragraph",
      content: [
        { type: "text", text: label ?? url, marks: [{ type: "link", attrs: { href: url } }, { type: "bold" }] },
      ],
    })),
  };
}

function deferredLookup() {
  let finish: (links: { url: string; title: string }[]) => void = () => {};
  const resolve = jest.fn(
    () =>
      new Promise<{ url: string; title: string }[]>((done) => {
        finish = done;
      }),
  );
  return { resolve, finish: (title = "Website") => finish([{ url: href, title }]) };
}

it("maps pending link positions through other edits and preserves formatting and cursor", async () => {
  const lookup = deferredLookup();
  const { result } = renderHook(() =>
    useEditor({ content: sourceDocument([href]), handlers: { ...handlers, resolveResourceLinks: lookup.resolve } }),
  );
  await waitFor(() => expect(lookup.resolve).toHaveBeenCalled());
  act(() => {
    const editor = result.current.editor;
    editor.view.dispatch(
      editor.state.tr.insert(0, editor.schema.nodes.paragraph.create(null, editor.schema.text("Before"))),
    );
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
  });
  await act(async () => lookup.finish());
  expect(result.current.editor.getJSON().content[1].content[0]).toMatchObject({
    text: "Website",
    marks: expect.arrayContaining([
      { type: "bold" },
      expect.objectContaining({ type: "link", attrs: expect.objectContaining({ href }) }),
    ]),
  });
  expect(result.current.editor.state.selection.from).toBe(result.current.editor.state.doc.content.size - 1);
});

it("batches and deduplicates multiple links while ignoring external and custom labels", async () => {
  const urls = Array.from({ length: 101 }, (_, i) => `${href}-${i}`);
  const resolveResourceLinks = jest.fn(async (batch: string[]) => batch.map((url) => ({ url, title: "Website" })));
  const doc = sourceDocument([...urls, urls[0] ?? href, "https://example.com"]);
  doc.content.push(...sourceDocument([href], "Custom").content);
  const { result } = renderHook(() => useEditor({ content: doc, handlers: { ...handlers, resolveResourceLinks } }));
  await waitFor(() => expect(result.current.editor.state.doc.firstChild.textContent).toBe("Website"));
  expect(resolveResourceLinks.mock.calls.map(([batch]) => batch.length)).toEqual([100, 1]);
  expect(result.current.editor.state.doc.lastChild.textContent).toBe("Custom");
});

it("ignores a pending reply after replacing content, even with the same URL", async () => {
  const lookup = deferredLookup();
  const { result } = renderHook(() =>
    useEditor({ content: sourceDocument([href]), handlers: { ...handlers, resolveResourceLinks: lookup.resolve } }),
  );
  await waitFor(() => expect(lookup.resolve).toHaveBeenCalledTimes(1));
  act(() => result.current.setContent(sourceDocument([href])));
  await act(async () => lookup.finish("Old response"));
  expect(result.current.editor.state.doc.textContent).toBe(href);
  await waitFor(() => expect(lookup.resolve).toHaveBeenCalledTimes(2));
  await act(async () => lookup.finish("Fresh response"));
  expect(result.current.editor.state.doc.textContent).toBe("Fresh response");
});

it("ignores a pending reply after deletion and after unmount", async () => {
  const lookup = deferredLookup();
  const { result, unmount } = renderHook(() =>
    useEditor({ content: sourceDocument([href]), handlers: { ...handlers, resolveResourceLinks: lookup.resolve } }),
  );
  await waitFor(() => expect(lookup.resolve).toHaveBeenCalled());
  act(() => result.current.editor.commands.deleteRange({ from: 1, to: href.length + 1 }));
  await act(async () => lookup.finish());
  expect(result.current.editor.state.doc.textContent).toBe("");
  unmount();
  await act(async () => lookup.finish());
});

it("allows undoing automatic conversion without immediately converting again", async () => {
  const resolveResourceLinks = jest.fn().mockResolvedValue([{ url: href, title: "Website" }]);
  const { result } = renderHook(() => useEditor({ handlers: { ...handlers, resolveResourceLinks } }));
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  act(() => result.current.editor.view.pasteText(href, Object.assign(new Event("paste"), { clipboardData: null })));
  await waitFor(() => expect(result.current.editor.state.doc.textContent).toBe("Website"));
  act(() => result.current.editor.commands.undo());
  expect(result.current.editor.state.doc.textContent).toBe(href);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
  expect(resolveResourceLinks).toHaveBeenCalledTimes(1);
  act(() => result.current.editor.commands.undo());
  expect(result.current.editor.state.doc.textContent).toBe("");
});

it.each(["failed", "unknown"])("keeps %s links usable without retrying on every transaction", async (kind) => {
  const resolveResourceLinks =
    kind === "failed" ? jest.fn().mockRejectedValue(new Error("offline")) : jest.fn().mockResolvedValue([]);
  const { result } = renderHook(() =>
    useEditor({ content: sourceDocument([href]), handlers: { ...handlers, resolveResourceLinks } }),
  );
  await waitFor(() => expect(resolveResourceLinks).toHaveBeenCalledTimes(1));
  act(() => result.current.editor.commands.setTextSelection(1));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
  expect(resolveResourceLinks).toHaveBeenCalledTimes(1);
  expect(result.current.editor.state.doc.textContent).toBe(href);
  expect(result.current.submittable).toBe(true);
});

it("does not make lookups in read-only content", async () => {
  const resolveResourceLinks = jest.fn().mockResolvedValue([]);
  renderHook(() =>
    useEditor({ content: sourceDocument([href]), editable: false, handlers: { ...handlers, resolveResourceLinks } }),
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
  expect(resolveResourceLinks).not.toHaveBeenCalled();
});

it("resolves typed URLs after Tiptap recognizes the link", async () => {
  const resolveResourceLinks = jest.fn().mockResolvedValue([{ url: href, title: "Website" }]);
  const { result } = renderHook(() => useEditor({ handlers: { ...handlers, resolveResourceLinks } }));
  await waitFor(() => expect(result.current.editor).not.toBeNull());
  act(() => {
    const editor = result.current.editor;
    editor.view.dispatch(editor.state.tr.insertText(`${href} `));
  });
  await waitFor(() => expect(result.current.editor.state.doc.textContent).toBe("Website "));
});
