import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import * as assert from "node:assert";
import { convertMarkdownToTiptap } from "../../core/markdown-to-tiptap";

describe("Markdown to Tiptap Conversion", () => {
  it("converts empty string to empty doc", () => {
    const result = convertMarkdownToTiptap("");
    assert.deepStrictEqual(result, {
      type: "doc",
      content: [],
    });
  });

  it("converts headings", () => {
    const result = convertMarkdownToTiptap("# Heading 1\n## Heading 2\n### Heading 3");
    assert.strictEqual(result.type, "doc");
    assert.ok(Array.isArray(result.content));
    assert.strictEqual((result.content as any)[0].type, "heading");
    assert.strictEqual((result.content as any)[0].attrs.level, 1);
    assert.strictEqual((result.content as any)[1].type, "heading");
    assert.strictEqual((result.content as any)[1].attrs.level, 2);
  });

  it("converts bold text", () => {
    const result = convertMarkdownToTiptap("This is **bold** text");
    assert.strictEqual(result.type, "doc");
    const paragraph = (result.content as any)[0];
    assert.strictEqual(paragraph.type, "paragraph");
    const boldMark = paragraph.content.find((node: any) => node.marks?.some((m: any) => m.type === "bold"));
    assert.ok(boldMark, "Should have bold mark");
  });

  it("converts italic text", () => {
    const result = convertMarkdownToTiptap("This is *italic* text");
    assert.strictEqual(result.type, "doc");
    const paragraph = (result.content as any)[0];
    assert.strictEqual(paragraph.type, "paragraph");
    const italicMark = paragraph.content.find((node: any) => node.marks?.some((m: any) => m.type === "italic"));
    assert.ok(italicMark, "Should have italic mark");
  });

  it("converts unordered lists", () => {
    const result = convertMarkdownToTiptap("- Item 1\n- Item 2\n- Item 3");
    assert.strictEqual(result.type, "doc");
    const list = (result.content as any)[0];
    assert.strictEqual(list.type, "bulletList");
    assert.strictEqual(list.content.length, 3);
  });

  it("converts ordered lists", () => {
    const result = convertMarkdownToTiptap("1. First\n2. Second\n3. Third");
    assert.strictEqual(result.type, "doc");
    const list = (result.content as any)[0];
    assert.strictEqual(list.type, "orderedList");
    assert.strictEqual(list.content.length, 3);
  });

  it("converts links", () => {
    const result = convertMarkdownToTiptap("Check out [this link](https://example.com)");
    assert.strictEqual(result.type, "doc");
    const paragraph = (result.content as any)[0];
    const linkNode = paragraph.content.find((node: any) => node.marks?.some((m: any) => m.type === "link"));
    assert.ok(linkNode, "Should have link mark");
    const linkMark = linkNode.marks.find((m: any) => m.type === "link");
    assert.strictEqual(linkMark.attrs.href, "https://example.com");
  });

  it("converts inline code", () => {
    const result = convertMarkdownToTiptap("This is `inline code` here");
    assert.strictEqual(result.type, "doc");
    const paragraph = (result.content as any)[0];
    const codeNode = paragraph.content.find((node: any) => node.marks?.some((m: any) => m.type === "code"));
    assert.ok(codeNode, "Should have code mark");
  });

  it("converts code blocks", () => {
    const result = convertMarkdownToTiptap("```javascript\nconst x = 1;\n```");
    assert.strictEqual(result.type, "doc");
    const codeBlock = (result.content as any)[0];
    assert.strictEqual(codeBlock.type, "codeBlock");
  });

  it("converts blockquotes", () => {
    const result = convertMarkdownToTiptap("> This is a quote");
    assert.strictEqual(result.type, "doc");
    const blockquote = (result.content as any)[0];
    assert.strictEqual(blockquote.type, "blockquote");
  });

  it("converts horizontal rules", () => {
    const result = convertMarkdownToTiptap("---");
    assert.strictEqual(result.type, "doc");
    const hr = (result.content as any)[0];
    assert.strictEqual(hr.type, "horizontalRule");
  });

  it("converts mixed content", () => {
    const markdown = `# Project Update

This is a **bold** statement with *italic* text.

## Tasks
- Complete feature A
- Review PR for feature B
- Deploy to staging

Check out [the docs](https://example.com) for more info.

\`\`\`bash
npm install
\`\`\``;

    const result = convertMarkdownToTiptap(markdown);
    assert.strictEqual(result.type, "doc");
    assert.ok(Array.isArray(result.content));
    assert.ok((result.content as any).length > 5, "Should have multiple content blocks");
  });

  it("handles nested lists", () => {
    const result = convertMarkdownToTiptap("- Item 1\n  - Nested 1\n  - Nested 2\n- Item 2");
    assert.strictEqual(result.type, "doc");
    const list = (result.content as any)[0];
    assert.strictEqual(list.type, "bulletList");
  });

  it("handles strikethrough", () => {
    const result = convertMarkdownToTiptap("This is ~~strikethrough~~ text");
    assert.strictEqual(result.type, "doc");
    const paragraph = (result.content as any)[0];
    assert.strictEqual(paragraph.type, "paragraph");
  });

  it("handles multiple paragraphs", () => {
    const result = convertMarkdownToTiptap("Paragraph 1\n\nParagraph 2\n\nParagraph 3");
    assert.strictEqual(result.type, "doc");
    assert.strictEqual((result.content as any).length, 3);
    assert.strictEqual((result.content as any)[0].type, "paragraph");
    assert.strictEqual((result.content as any)[1].type, "paragraph");
    assert.strictEqual((result.content as any)[2].type, "paragraph");
  });

  it("handles valid markdown without throwing", () => {
    assert.doesNotThrow(() => {
      convertMarkdownToTiptap("Valid markdown");
    });
  });
});

it("preserves nested and mixed task lists, loose paragraphs, and inline formatting", () => {
  const result = convertMarkdownToTiptap(
    "Before\n\n- [x] **Done**\n  - [ ] [Review](https://example.com)\n- Ordinary\n- [ ] Pending\n\n  More details\n\nAfter",
  );
  const json = JSON.stringify(result);
  assert.ok(json.includes('"type":"taskList"'));
  assert.ok(json.includes('"checked":true'));
  assert.ok(json.includes('"checked":false'));
  for (const text of ["Before", "After", "Ordinary", "Pending", "More details", "Review"])
    assert.ok(json.includes(text));
  assert.ok(json.includes('"type":"bold"'));
  assert.ok(json.includes('"href":"https://example.com"'));
  assert.ok(json.includes('"type":"bulletList"'));
});

const tableFixtures = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../app/test/fixtures/rich_text/tables.json"), "utf8"),
);

for (const fixture of tableFixtures) {
  it(`imports table export: ${fixture.name}`, () => {
    const doc = convertMarkdownToTiptap(fixture.markdown) as any;
    const table = doc.content.find((node: any) => node.type === "table");
    assert.ok(table);
    assert.ok(table.content[0].content.every((cell: any) => cell.type === "tableHeader"));
    const original = fixture.document.content[1];
    const headerless = original.content[0].content.some((cell: any) => cell.type !== "tableHeader");
    assert.strictEqual(table.content.length, original.content.length + (headerless ? 1 : 0));
    const cellText = (node: any): string => {
      if (node.type === "hardBreak") return "\n";
      if (node.type === "mention") return `@${node.attrs.label}`;
      if (node.type === "blob") return node.attrs.title;
      if (node.type === "text") return node.text;
      return (node.content ?? [])
        .map(cellText)
        .join(node.type === "tableCell" || node.type === "tableHeader" ? "\n" : "");
    };
    const expected = original.content.map((row: any) => row.content.map(cellText));
    if (headerless) expected.unshift(original.content[0].content.map(() => ""));
    assert.deepStrictEqual(
      table.content.map((row: any) => row.content.map(cellText)),
      expected,
    );
    assert.strictEqual(doc.content[0].content[0].text, "Before");
    assert.strictEqual(doc.content.at(-1).content[0].text, "After");
  });
}

it("pads short rows and discards alignment", () => {
  const doc = convertMarkdownToTiptap("| A | B |\n| :--- | ---: |\n| one |") as any;
  const [header, row] = doc.content[0].content;
  assert.strictEqual(row.content.length, 2);
  assert.deepStrictEqual(row.content[1].content, [{ type: "paragraph" }]);
  for (const cell of [...header.content, ...row.content]) {
    assert.strictEqual(cell.attrs.colspan, 1);
    assert.strictEqual(cell.attrs.rowspan, 1);
    assert.strictEqual(cell.attrs.colwidth, null);
    assert.strictEqual(cell.attrs.align, undefined);
  }
});

it("rejects excess cells instead of silently truncating them", () => {
  assert.throws(() => convertMarkdownToTiptap("| A | B |\n| --- | --- |\n| 1 | 2 | 3 |"), /table.*cells/i);
});

it("leaves ordinary pipe text and fenced tables alone", () => {
  for (const markdown of [
    "a | b\nc | d",
    "```md\n| A | B |\n| --- | --- |\n| 1 | 2 | 3 |\n```",
    "~~~\n\n| A |\n| --- |\n~~~",
  ]) {
    const doc = convertMarkdownToTiptap(markdown) as any;
    assert.ok(doc.content.every((node: any) => node.type !== "table"));
  }
});

const importFixtures = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../app/test/fixtures/rich_text/table_imports.json"), "utf8"),
);
for (const fixture of importFixtures) {
  it(`shared table input: ${fixture.name}`, () => {
    if (fixture.invalid) {
      assert.throws(() => convertMarkdownToTiptap(fixture.markdown), /table.*cells/i);
      return;
    }
    const table = (convertMarkdownToTiptap(fixture.markdown) as any).content[0];
    const marks = new Set<string>();
    const cells = table.content.map((row: any) =>
      row.content.map((cell: any) =>
        (cell.content[0].content ?? [])
          .map((node: any) => {
            for (const mark of node.marks ?? []) marks.add(mark.type);
            return node.type === "hardBreak" ? "\n" : node.text;
          })
          .join(""),
      ),
    );
    assert.deepStrictEqual(cells, fixture.cells);
    assert.deepStrictEqual([...marks].sort(), [...fixture.marks].sort());
  });
}
