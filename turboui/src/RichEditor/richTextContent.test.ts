import { normalizeRichTextContent } from "./richTextContent";

const descriptionWithEmptyTextNodes = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "" },
        { type: "text", text: "First paragraph from the API." },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Second paragraph from the API." },
        { type: "text", text: "" },
      ],
    },
  ],
};

const validRichDescription = {
  type: "doc",
  content: [
    { type: "paragraph" },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Hello ", marks: [{ type: "bold" }] },
        {
          type: "mention",
          attrs: { id: "jane-doe-abc123", label: "Jane Doe" },
          marks: [{ type: "bold" }],
        },
      ],
    },
  ],
};

describe("normalizeRichTextContent", () => {
  it("removes empty text nodes without mutating the source document", () => {
    expect(normalizeRichTextContent(descriptionWithEmptyTextNodes)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "First paragraph from the API." }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Second paragraph from the API." }],
        },
      ],
    });
    expect(descriptionWithEmptyTextNodes.content[0]?.content?.[0]).toEqual({ type: "text", text: "" });
  });

  it("leaves valid rich text, empty paragraphs, mentions, attributes, and marks unchanged", () => {
    expect(normalizeRichTextContent(validRichDescription)).toBe(validRichDescription);
  });
});
