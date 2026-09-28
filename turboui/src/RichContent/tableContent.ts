import type { JSONContent } from "@tiptap/core";

/** Flatten a table for previews, retaining mentions, attachments, and readable cell boundaries. */
export function tableContentToInline(table: JSONContent, rowSeparator = " / "): JSONContent[] {
  return joinContent(
    (table.content ?? []).map((row) => joinContent((row.content ?? []).map(cellContentToInline), " | ")),
    rowSeparator,
  );
}

function cellContentToInline(cell: JSONContent): JSONContent[] {
  const paragraphs = (cell.content ?? []).map((paragraph) => (paragraph.content ?? []).flatMap(previewInline));
  return joinContent(paragraphs, " / ");
}

function previewInline(node: JSONContent): JSONContent[] {
  if (node.type === "mention" || node.type === "blob") return [node];
  if (node.type === "hardBreak") return [{ type: "text", text: " / " }];
  if (node.type === "text") return [{ type: "text", text: (node.text ?? "").replace(/\r\n?|\n/g, " / ") }];
  return [];
}

function joinContent(parts: JSONContent[][], separator: string): JSONContent[] {
  return parts.flatMap((part, index) => (index === 0 ? part : [{ type: "text", text: separator }, ...part]));
}
