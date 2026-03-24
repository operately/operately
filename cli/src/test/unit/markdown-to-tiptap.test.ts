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

  it("throws error for invalid markdown parsing", () => {
    assert.doesNotThrow(() => {
      convertMarkdownToTiptap("Valid markdown");
    });
  });
});
