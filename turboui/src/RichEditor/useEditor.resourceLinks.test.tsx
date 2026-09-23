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
const handlers = { mentionedPersonLookup: async () => null };

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
