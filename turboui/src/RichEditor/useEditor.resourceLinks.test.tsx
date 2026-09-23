import { act, renderHook, waitFor } from "@testing-library/react";
import { useEditor, type RichEditorHandlers } from "./useEditor";
import type { ResourceLinkTitle } from "../RichContent/resourceLinks";

const href = `${window.location.origin}/acme-0abc/projects/website-xyz`;
const content = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }] }],
};
const title: ResourceLinkTitle = { type: "project", id: "xyz", title: "Website" };
const mentionedPersonLookup = async () => null;

it("resolves its own read-only content without changing the source or destination", async () => {
  const resolveResourceLinkTitles = jest.fn().mockResolvedValue([title]);
  const { result } = renderHook(() =>
    useEditor({
      content,
      editable: false,
      handlers: { mentionedPersonLookup, resolveResourceLinkTitles },
    }),
  );

  await waitFor(() => expect(result.current.getJson().content[0].content[0].text).toBe("Website"));
  expect(resolveResourceLinkTitles).toHaveBeenCalledWith(content);
  expect(result.current.getJson().content[0].content[0].marks[0].attrs.href).toBe(href);
  expect(content.content[0]?.content[0]?.text).toBe(href);
});

it("does not resolve or replace editable content", async () => {
  const resolveResourceLinkTitles = jest.fn().mockResolvedValue([title]);
  const { result } = renderHook(() =>
    useEditor({
      content,
      editable: true,
      handlers: { mentionedPersonLookup, resolveResourceLinkTitles },
    }),
  );

  await waitFor(() => expect(result.current.editor).not.toBeNull());
  expect(result.current.getJson().content[0].content[0].text).toBe(href);
  expect(resolveResourceLinkTitles).not.toHaveBeenCalled();
});

it("ignores a late response after switching content", async () => {
  let finish: (titles: ResourceLinkTitle[]) => void = () => {};
  const pending = new Promise<ResourceLinkTitle[]>((resolve) => {
    finish = resolve;
  });
  const resolveResourceLinkTitles = jest.fn().mockReturnValueOnce(pending).mockResolvedValue([]);
  const handlers = { mentionedPersonLookup, resolveResourceLinkTitles };
  const { result, rerender } = renderHook(({ value }) => useEditor({ content: value, editable: false, handlers }), {
    initialProps: { value: content },
  });
  await waitFor(() => expect(resolveResourceLinkTitles).toHaveBeenCalledTimes(1));
  const next = {
    ...content,
    content: [{ type: "paragraph", content: [{ type: "text", text: "Other task", marks: [] }] }],
  };
  rerender({ value: next });
  await act(async () => finish([title]));
  await waitFor(() => expect(result.current.getJson().content[0].content[0].text).toBe("Other task"));
});

it("keeps the original URL when lookup fails", async () => {
  const resolveResourceLinkTitles = jest.fn().mockRejectedValue(new Error("Offline"));
  const { result } = renderHook(() =>
    useEditor({
      content,
      editable: false,
      handlers: { mentionedPersonLookup, resolveResourceLinkTitles },
    }),
  );
  await waitFor(() => expect(resolveResourceLinkTitles).toHaveBeenCalled());
  expect(result.current.getJson().content[0].content[0].text).toBe(href);
});

it("ignores a pending lookup after title resolution is disabled", async () => {
  let finish: (titles: ResourceLinkTitle[]) => void = () => {};
  const pending = new Promise<ResourceLinkTitle[]>((resolve) => {
    finish = resolve;
  });
  const resolver = jest.fn().mockReturnValue(pending);
  const { result, rerender } = renderHook(
    ({ resolveResourceLinkTitles }: Pick<RichEditorHandlers, "resolveResourceLinkTitles">) =>
      useEditor({ content, editable: false, handlers: { mentionedPersonLookup, resolveResourceLinkTitles } }),
    { initialProps: { resolveResourceLinkTitles: resolver } },
  );

  await waitFor(() => expect(resolver).toHaveBeenCalledTimes(1));
  rerender({ resolveResourceLinkTitles: null });
  await act(async () => finish([title]));

  expect(result.current.getJson().content[0].content[0].text).toBe(href);
  expect(resolver).toHaveBeenCalledTimes(1);
});
