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

  it("links a URL across formatted text nodes without losing their marks", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "https://example.com/" },
            { type: "text", text: "launch-plan", marks: [{ type: "bold" }] },
          ],
        },
      ],
    };

    expect(normalizeRichTextContent(content)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "https://example.com/",
              marks: [{ type: "link", attrs: { href: "https://example.com/launch-plan" } }],
            },
            {
              type: "text",
              text: "launch-plan",
              marks: [{ type: "bold" }, { type: "link", attrs: { href: "https://example.com/launch-plan" } }],
            },
          ],
        },
      ],
    });
  });

  it("keeps Markdown link syntax literal when formatting splits it across text nodes", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "[Launch plan](" },
            { type: "text", text: "https://example.com", marks: [{ type: "bold" }] },
            { type: "text", text: ")" },
          ],
        },
      ],
    };

    expect(normalizeRichTextContent(content)).toBe(content);
  });
});
