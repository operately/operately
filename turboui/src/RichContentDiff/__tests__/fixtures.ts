import type { JSONContent } from "@tiptap/core";

export function doc(...content: JSONContent[]): JSONContent {
  return { type: "doc", content };
}

export function paragraph(...content: JSONContent[]): JSONContent {
  return { type: "paragraph", content };
}

export function text(value: string, marks?: JSONContent["marks"]): JSONContent {
  return marks ? { type: "text", text: value, marks } : { type: "text", text: value };
}

export function heading(level: number, ...content: JSONContent[]): JSONContent {
  return { type: "heading", attrs: { level }, content };
}

export function bulletList(...items: JSONContent[]): JSONContent {
  return { type: "bulletList", content: items };
}

export function orderedList(start: number, ...items: JSONContent[]): JSONContent {
  return { type: "orderedList", attrs: { start }, content: items };
}

export function listItem(...content: JSONContent[]): JSONContent {
  return { type: "listItem", content };
}

export function mention(id: string, label: string): JSONContent {
  return { type: "mention", attrs: { id, label } };
}

export function blob(attrs: Record<string, unknown>): JSONContent {
  return {
    type: "blob",
    attrs: {
      src: null,
      alt: null,
      title: null,
      id: null,
      status: "uploaded",
      filetype: null,
      filesize: null,
      progress: 100,
      ...attrs,
    },
  };
}

export const identicalDoc = doc(paragraph(text("Hello world")));

export const charInsertBefore = doc(paragraph(text("Hello world")));
export const charInsertAfter = doc(paragraph(text("Hello worlds")));

export const wordReplaceBefore = doc(paragraph(text("The quick fox")));
export const wordReplaceAfter = doc(paragraph(text("The lazy fox")));

export const paragraphInsertBefore = doc(paragraph(text("First")));
export const paragraphInsertAfter = doc(paragraph(text("First")), paragraph(text("Second")));

export const distantChangesBefore = doc(paragraph(text("AAA")), paragraph(text("BBB")), paragraph(text("CCC")));
export const distantChangesAfter = doc(paragraph(text("AAA!")), paragraph(text("BBB")), paragraph(text("CCC?")));

export const paragraphToHeadingBefore = doc(paragraph(text("Title")));
export const paragraphToHeadingAfter = doc(heading(2, text("Title")));

export const headingLevelBefore = doc(heading(1, text("Title")));
export const headingLevelAfter = doc(heading(3, text("Title")));

export const listTypeBefore = doc(bulletList(listItem(paragraph(text("One")))));
export const listTypeAfter = doc(orderedList(1, listItem(paragraph(text("One")))));

export const listNestBefore = doc(bulletList(listItem(paragraph(text("Parent")))));
export const listNestAfter = doc(
  bulletList(listItem(paragraph(text("Parent")), bulletList(listItem(paragraph(text("Child")))))),
);

export const listItemInsertBefore = doc(bulletList(listItem(paragraph(text("One")))));
export const listItemInsertAfter = doc(bulletList(listItem(paragraph(text("One"))), listItem(paragraph(text("Two")))));

export const marksBefore = doc(paragraph(text("plain")));
export const marksAfter = doc(
  paragraph(
    text("plain", [
      { type: "bold" },
      { type: "italic" },
      { type: "strike" },
      { type: "highlight", attrs: { highlight: "yellow" } },
    ]),
  ),
);

export const markChanges = [
  { name: "bold", after: doc(paragraph(text("plain", [{ type: "bold" }]))) },
  { name: "italic", after: doc(paragraph(text("plain", [{ type: "italic" }]))) },
  { name: "strike", after: doc(paragraph(text("plain", [{ type: "strike" }]))) },
  {
    name: "highlight",
    after: doc(paragraph(text("plain", [{ type: "highlight", attrs: { highlight: "yellow" } }]))),
  },
] as const;

export const linkBefore = doc(paragraph(text("docs", [{ type: "link", attrs: { href: "https://old.example" } }])));
export const linkAfter = doc(paragraph(text("docs", [{ type: "link", attrs: { href: "https://new.example" } }])));

export const mentionBefore = doc(paragraph(mention("person-1", "Ada")));
export const mentionAfter = doc(paragraph(mention("person-2", "Grace")));

export const blobBefore = doc(paragraph(blob({ id: "blob-1", alt: "Old caption", filetype: "image/png" })));
export const blobAfter = doc(paragraph(blob({ id: "blob-2", alt: "New caption", filetype: "image/png" })));

export const blobIgnoredBefore = doc(
  paragraph(
    blob({
      id: "blob-1",
      alt: "Same",
      src: "https://cdn.example/temp-a",
      progress: 40,
      status: "uploading",
    }),
  ),
);
export const blobIgnoredAfter = doc(
  paragraph(
    blob({
      id: "blob-1",
      alt: "Same",
      src: "https://cdn.example/temp-b",
      progress: 100,
      status: "uploaded",
    }),
  ),
);

export const emojiBefore = doc(paragraph(text("Hello 👋")));
export const emojiAfter = doc(paragraph(text("Hello 👋 world")));

export const reorderBefore = doc(heading(2, text("Unique heading alpha")), paragraph(text("Distinct paragraph beta")));
export const reorderAfter = doc(paragraph(text("Distinct paragraph beta")), heading(2, text("Unique heading alpha")));

export const keyOrderBefore = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          marks: [{ type: "bold" }, { type: "italic" }],
          type: "text",
          text: "hi",
        },
      ],
    },
  ],
};

export const keyOrderAfter = {
  content: [
    {
      content: [
        {
          text: "hi",
          type: "text",
          marks: [{ type: "italic" }, { type: "bold" }],
        },
      ],
      type: "paragraph",
    },
  ],
  type: "doc",
};

/** Large document for timing measurement (many paragraphs with mixed marks). */
export function buildLargeDocument(paragraphCount = 400): JSONContent {
  const content: JSONContent[] = [];

  for (let i = 0; i < paragraphCount; i++) {
    if (i % 10 === 0) {
      content.push(heading(2, text(`Section ${i / 10}`)));
    }

    content.push(
      paragraph(
        text(
          `Paragraph ${i} with some filler text to approximate a long document body. `,
          i % 3 === 0 ? [{ type: "bold" }] : undefined,
        ),
        text("More words. "),
        i % 5 === 0 ? mention(`person-${i % 7}`, `Person ${i % 7}`) : text("Plain words. "),
      ),
    );
  }

  return doc(...content);
}
