// Shared helpers for building tiptap-style rich text JSON used across stories
export function asRichText(content: string): any {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      },
    ],
  };
}

export function asRichTextWithList(
  paragraphs: string[],
  listItems: string[] = [],
  trailingParagraphs: string[] = [],
): any {
  const content: any[] = paragraphs.map((text) => ({
    type: "paragraph",
    content: [{ type: "text", text }],
  }));

  if (listItems.length > 0) {
    content.push({
      type: "bulletList",
      content: listItems.map((item) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: item }],
          },
        ],
      })),
    });
  }

  trailingParagraphs.forEach((text) => {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text }],
    });
  });

  return {
    type: "doc",
    content,
  };
}
