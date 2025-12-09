// Storybook helper for generating rich-text JSON strings from plain text.
// This mirrors the shape expected by the app's rich text editor, where
// `task.description` is a JSON string that can be `JSON.parse`d.

export function richTextFromString(text: string): string {
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: text
          ? [
              {
                type: "text",
                text,
              },
            ]
          : [],
      },
    ],
  });
}
