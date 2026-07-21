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

function cloneDoc(value: JSONContent): JSONContent {
  return JSON.parse(JSON.stringify(value)) as JSONContent;
}

function appendFillerParagraphs(content: JSONContent[], paragraphCount: number) {
  for (let i = 0; i < paragraphCount; i++) {
    if (i % 10 === 0) {
      content.push(heading(2, text(`Filler section ${i / 10}`)));
    }

    content.push(
      paragraph(
        text(
          `Filler paragraph ${i} with enough text to keep the document long. `,
          i % 3 === 0 ? [{ type: "bold" }] : undefined,
        ),
        text("More words. "),
        i % 5 === 0 ? mention(`person-${i % 7}`, `Person ${i % 7}`) : text("Plain words. "),
      ),
    );
  }
}

function spacer(label: string): JSONContent {
  return paragraph(text(`Unchanged spacer — ${label}.`));
}

/**
 * Large before/after pair for Storybook: keeps bulk filler text, but seeds a
 * showcase region with many change kinds (emoji, mention, blob, lists, etc.).
 * Showcase edits are separated by unchanged spacers so ChangeSet simplification
 * does not merge them into one large replacement.
 */
export function buildLargeDocumentShowcasePair(fillerParagraphCount = 80): {
  before: JSONContent;
  after: JSONContent;
} {
  const beforeBlocks: JSONContent[] = [
    heading(1, text("Product update")),
    spacer("after title"),
    paragraph(text("Hello 👋 welcome to the draft.")),
    spacer("after emoji"),
    paragraph(text("Please review with "), mention("bob_williams", "Bob Williams"), text(".")),
    spacer("after mention"),
    paragraph(blob({ id: "blob-demo-1", alt: "Architecture diagram", filetype: "image/png" })),
    spacer("after blob"),
    paragraph(text("docs", [{ type: "link", attrs: { href: "https://old.example/docs" } }])),
    spacer("after link"),
    bulletList(listItem(paragraph(text("Ship the spike"))), listItem(paragraph(text("Write tests")))),
    spacer("after list"),
    paragraph(text("Plain summary without emphasis.")),
    spacer("after marks target"),
    heading(2, text("Notes")),
    spacer("after heading"),
    paragraph(text("This paragraph will be removed entirely.")),
    spacer("after removal target"),
    paragraph(text("Keep this bridge paragraph.")),
    spacer("after bridge"),
    paragraph(text("The quick fox jumps over the fence.")),
    spacer("after word replace"),
    paragraph(text("Status line stays mostly the same.")),
    spacer("after char edit"),
    paragraph(text("A plain paragraph that becomes a heading.")),
    spacer("after block-type target"),
  ];

  appendFillerParagraphs(beforeBlocks, fillerParagraphCount);

  const before = doc(...beforeBlocks);
  const afterBlocks = cloneDoc(before).content!;

  const replaceMatching = (predicate: (block: JSONContent) => boolean, next: JSONContent) => {
    const index = afterBlocks.findIndex(predicate);
    if (index >= 0) afterBlocks[index] = next;
  };

  replaceMatching(
    (block) => block.type === "paragraph" && block.content?.[0]?.text === "Hello 👋 welcome to the draft.",
    paragraph(text("Hello 👋🎉 welcome to the published note.")),
  );

  replaceMatching(
    (block) =>
      block.type === "paragraph" &&
      !!block.content?.some((node) => node.type === "mention" && node.attrs?.id === "bob_williams"),
    paragraph(text("Please review with "), mention("grace_wilson", "Grace Wilson"), text(".")),
  );

  replaceMatching(
    (block) =>
      block.type === "paragraph" &&
      !!block.content?.some((node) => node.type === "blob" && node.attrs?.id === "blob-demo-1"),
    paragraph(blob({ id: "blob-demo-2", alt: "Updated architecture diagram", filetype: "image/png" })),
  );

  replaceMatching(
    (block) =>
      block.type === "paragraph" &&
      block.content?.[0]?.text === "docs" &&
      block.content?.[0]?.marks?.[0]?.attrs?.href === "https://old.example/docs",
    paragraph(text("docs", [{ type: "link", attrs: { href: "https://new.example/docs" } }])),
  );

  replaceMatching(
    (block) => block.type === "bulletList",
    orderedList(
      1,
      listItem(paragraph(text("Ship the spike"))),
      listItem(paragraph(text("Write tests")), bulletList(listItem(paragraph(text("Cover blob diffs"))))),
      listItem(paragraph(text("Publish the release notes"))),
    ),
  );

  replaceMatching(
    (block) => block.type === "paragraph" && block.content?.[0]?.text === "Plain summary without emphasis.",
    paragraph(
      text("Plain summary without emphasis.", [
        { type: "bold" },
        { type: "italic" },
        { type: "strike" },
        { type: "highlight", attrs: { highlight: "yellow" } },
      ]),
    ),
  );

  replaceMatching(
    (block) => block.type === "heading" && block.attrs?.level === 2 && block.content?.[0]?.text === "Notes",
    heading(3, text("Notes")),
  );

  const removalIndex = afterBlocks.findIndex(
    (block) => block.type === "paragraph" && block.content?.[0]?.text === "This paragraph will be removed entirely.",
  );
  if (removalIndex >= 0) {
    afterBlocks.splice(removalIndex, 1);
  }

  const bridgeIndex = afterBlocks.findIndex(
    (block) => block.type === "paragraph" && block.content?.[0]?.text === "Keep this bridge paragraph.",
  );
  if (bridgeIndex >= 0) {
    afterBlocks.splice(
      bridgeIndex + 1,
      0,
      paragraph(text("Brand-new paragraph inserted in the middle.")),
      paragraph(text("Another added line with a celebration 🚀")),
    );
  }

  replaceMatching(
    (block) => block.type === "paragraph" && block.content?.[0]?.text === "The quick fox jumps over the fence.",
    paragraph(text("The lazy fox jumps over the fence.")),
  );

  replaceMatching(
    (block) => block.type === "paragraph" && block.content?.[0]?.text === "Status line stays mostly the same.",
    paragraph(text("Status line stays mostly the same!")),
  );

  replaceMatching(
    (block) =>
      block.type === "paragraph" && block.content?.[0]?.text === "A plain paragraph that becomes a heading.",
    heading(2, text("A plain paragraph that becomes a heading.")),
  );

  replaceMatching(
    (block) => block.type === "heading" && block.content?.[0]?.text === "Filler section 2",
    heading(3, text("Filler section 2 (renamed)")),
  );

  // Distant small edit near the end of the filler region.
  for (let i = afterBlocks.length - 1; i >= 0; i--) {
    const block = afterBlocks[i]!;
    if (block.type === "paragraph" && typeof block.content?.[0]?.text === "string" && block.content[0].text.startsWith("Filler paragraph")) {
      afterBlocks[i] = paragraph(text("Distant edit near the end of a long document."));
      break;
    }
  }

  afterBlocks.push(paragraph(text("Closing paragraph added after everything else.")));

  return { before, after: doc(...afterBlocks) };
}
