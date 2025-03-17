import { MarkdownSerializer, MarkdownSerializerState } from "prosemirror-markdown";
import { Node, Schema, Fragment, Mark } from "prosemirror-model";

interface MarkdownExportOptions {
  removeEmbeds?: boolean;
}

type NodeSerializerFn = (state: MarkdownSerializerState, node: Node, parent: Node | null, index: number) => void;
type MarkSerializerSpec = {
  open: string | ((state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) => string);
  close: string | ((state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) => string);
  mixable?: boolean;
  expelEnclosingWhitespace?: boolean;
  escape?: boolean;
};

// ProseMirror schema and serializer aligned with GFM (GitHub Flavored Markdown)
// See spec: https://github.github.com/gfm/
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    text: { group: "inline" },
    hardBreak: { group: "inline", inline: true },
    heading: {
      attrs: { level: { default: 1 } },
      content: "inline*",
      group: "block",
    },
    blockquote: { content: "block+", group: "block" },
    bulletList: { content: "listItem+", group: "block" },
    orderedList: {
      content: "listItem+",
      group: "block",
      attrs: { start: { default: 1 } },
    },
    listItem: { content: "paragraph block*", group: "block" },
    horizontalRule: { group: "block" },
    codeBlock: {
      content: "text*",
      marks: "",
      group: "block",
      attrs: { language: { default: null } },
    },
  },
  marks: {
    bold: {},
    italic: {},
    strike: {},
    code: {},
    link: {
      attrs: {
        href: { default: null },
        title: { default: null },
      },
    },
    highlight: {
      attrs: {
        highlight: { default: null },
      },
    },
  },
});

const serializer = new MarkdownSerializer(
  {
    text: ((state: MarkdownSerializerState, node: Node) => {
      state.text(node.text || "");
    }) as NodeSerializerFn,

    paragraph: ((state: MarkdownSerializerState, node: Node) => {
      state.renderInline(node);
      state.closeBlock(node);
    }) as NodeSerializerFn,

    heading: ((state: MarkdownSerializerState, node: Node) => {
      state.write(state.repeat("#", node.attrs.level) + " ");
      state.renderInline(node);
      state.closeBlock(node);
    }) as NodeSerializerFn,

    blockquote: ((state: MarkdownSerializerState, node: Node) => {
      state.wrapBlock("> ", null, node, () => state.renderContent(node));
    }) as NodeSerializerFn,

    codeBlock: ((state: MarkdownSerializerState, node: Node) => {
      const lang = node.attrs.language || "";
      state.write("```" + lang + "\n");
      state.text(node.textContent);
      state.ensureNewLine();
      state.write("```");
      state.closeBlock(node);
    }) as NodeSerializerFn,

    horizontalRule: ((state: MarkdownSerializerState, node: Node) => {
      state.write("---");
      state.closeBlock(node);
    }) as NodeSerializerFn,

    hardBreak: ((state: MarkdownSerializerState) => {
      // GFM requires two spaces followed by newline for hard breaks
      state.write("  \n");
    }) as NodeSerializerFn,

    listItem: ((state: MarkdownSerializerState, node: Node) => {
      state.renderContent(node);
    }) as NodeSerializerFn,

    bulletList: ((state: MarkdownSerializerState, node: Node) => {
      state.renderList(node, "  ", () => "* ");
    }) as NodeSerializerFn,

    orderedList: ((state: MarkdownSerializerState, node: Node) => {
      const start = node.attrs.start || 1;
      state.renderList(node, "  ", (i) => `${start + i}. `);
    }) as NodeSerializerFn,

    // Custom nodes
    blob: ((state: MarkdownSerializerState, node: Node) => {
      // image syntax with optional title
      const alt = node.attrs.alt || "";
      const src = node.attrs.src || "";
      const title = node.attrs.title;

      // If it's a non-image file, use link syntax instead
      if (node.attrs.filetype && !node.attrs.filetype.startsWith("image/")) {
        state.write(`[${alt || node.attrs.title || "File"}](${src}${title ? ` "${title}"` : ""})`);
      } else {
        state.write(`![${alt}](${src}${title ? ` "${title}"` : ""})`);
      }
    }) as NodeSerializerFn,

    mention: ((state: MarkdownSerializerState, node: Node) => {
      // user mentions
      state.write(`@${node.attrs.label || ""}`);
    }) as NodeSerializerFn,
  },
  {
    bold: { open: "**", close: "**", mixable: true },
    italic: { open: "_", close: "_", mixable: true },
    strike: { open: "~~", close: "~~", mixable: true },
    code: { open: "`", close: "`", escape: false },
    link: {
      open: "[",
      close: ((_state: MarkdownSerializerState, mark: Mark) => {
        const href = mark.attrs.href || "";
        const title = mark.attrs.title;
        return `](${href}${title ? ` "${title}"` : ""})`;
      }) as MarkSerializerSpec["close"],
    },
    highlight: {
      open: ((_state: MarkdownSerializerState, mark: Mark) => {
        const highlight = mark.attrs.highlight;
        // Use HTML comments for highlight since GFM doesn't have native syntax
        return highlight ? `<!-- highlight: ${highlight} -->` : "";
      }) as MarkSerializerSpec["open"],
      close: ((_state: MarkdownSerializerState, mark: Mark) => {
        return mark.attrs.highlight ? "<!-- /highlight -->" : "";
      }) as MarkSerializerSpec["close"],
    },
  },
);

/**
 * Recursively removes nodes of a specific type from the document
 */
function removeNodes(node: Node, type: string): Node {
  if (!node?.content || node.type.name === "text") return node;

  const filteredContent = Array.from(node.content.content)
    .filter((n: Node) => n.type.name !== type)
    .map((n: Node) => removeNodes(n, type));

  return node.type.create(node.attrs, Fragment.from(filteredContent), node.marks);
}

/**
 * Converts a ProseMirror JSON document to GitHub Flavored Markdown
 */
export function exportToMarkdown(json: any, options: MarkdownExportOptions = {}): string {
  try {
    let doc = Node.fromJSON(schema, json);

    if (options.removeEmbeds) {
      doc = removeNodes(doc, "blob");
    }

    return serializer.serialize(doc);
  } catch (error) {
    console.error("Error exporting to Markdown:", error);
    throw error;
  }
}

/**
 * Downloads content as a markdown file
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${filename}.md`;
  anchor.click();

  URL.revokeObjectURL(url);
}
