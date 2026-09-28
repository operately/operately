import { restoreRichTextSource } from "./restoreSource";

const href = "/acme/projects/website-abc?tab=overview#comments";
const node = (text: string, metadata: unknown = { originalText: href, resolvedText: "Website" }) => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text, marks: [{ type: "link", attrs: { href, operatelyResourceLink: metadata } }] }],
    },
  ],
});

it("restores generated labels and strips response metadata without mutating the input", () => {
  const input = node("Website");
  const result = restoreRichTextSource(input);
  const text = result.content[0]?.content[0];
  expect(text?.text).toBe(href);
  expect(text?.marks[0]?.attrs).toEqual({ href });
  expect(input.content[0]?.content[0]?.text).toBe("Website");
});

it("preserves custom edits and rejects metadata that does not describe the URL", () => {
  expect(restoreRichTextSource(node("Custom")).content[0]?.content[0]?.text).toBe("Custom");
  expect(
    restoreRichTextSource(node("Website", { originalText: "Forged", resolvedText: "Website" })).content[0]?.content[0]
      ?.text,
  ).toBe("Website");
});

it("handles JSON strings, null, malformed strings and untouched documents", () => {
  const encoded = JSON.stringify(node("Website"));
  expect(JSON.parse(restoreRichTextSource(encoded)).content[0].content[0].text).toBe(href);
  expect(restoreRichTextSource(null)).toBeNull();
  expect(restoreRichTextSource("{bad")).toBe("{bad");
  const original = { type: "doc", content: [] };
  expect(restoreRichTextSource(original)).toBe(original);
});
