import { summarize } from "./Summary";

describe("summarize", () => {
  it("keeps short text intact", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Contrary to popular belief" }],
        },
      ],
    };

    expect(summarize(input)).toEqual(input);
  });

  it("keeps mentions intact", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello " },
            { type: "mention", attrs: { label: "John Doe" } },
          ],
        },
      ],
    };

    expect(summarize(input)).toEqual(input);
  });

  it("joins paragraphs", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "World" }],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello" },
            { type: "text", text: " " },
            { type: "text", text: "World" },
          ],
        },
      ],
    });
  });

  it("joins bullet lists", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "text", text: "Hello" }],
            },
            {
              type: "listItem",
              content: [{ type: "text", text: "World" }],
            },
          ],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "• Hello • World" }],
        },
      ],
    });
  });

  it("joins ordered lists", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [{ type: "text", text: "Hello" }],
            },
            {
              type: "listItem",
              content: [{ type: "text", text: "World" }],
            },
          ],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "1. Hello 2. World" }] }],
    });
  });

  it("converts headings to text", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "heading",
          content: [{ type: "text", text: "Hello" }],
          attrs: { level: 1 },
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }],
    });
  });

  it("handles blockquotes", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "This is a quote" }],
            },
          ],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "This is a quote" }] }],
    });
  });

  it("handles blockquotes with multiple paragraphs", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "First paragraph" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Second paragraph" }],
            },
          ],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "First paragraph" },
            { type: "text", text: " " },
            { type: "text", text: "Second paragraph" },
          ],
        },
      ],
    });
  });
});
