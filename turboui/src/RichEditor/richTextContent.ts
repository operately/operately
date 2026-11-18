import { isAllowedUri } from "@tiptap/extension-link";
import { find } from "linkifyjs";

// Matches Markdown links so their destination is not mistaken for a bare URL.
// This mirrors the syntax supported by Tiptap's Link extension, including one
// level of balanced parentheses and optional quoted titles.
const MARKDOWN_LINK_REGEX = /\[([^\[\]]+)\]\(((?:[^\s()]|\([^\s()]*\))+)(?:\s+(?:(["'])(.*?)\3|“(.*?)”|‘(.*?)’))?\)/g;

export interface RichTextMark {
  type: string;
  attrs?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RichTextNode {
  type: string;
  text?: string;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  [key: string]: unknown;
}

export type RichTextContent = RichTextNode | RichTextNode[] | string | null | undefined;

export type NormalizedRichTextContent = Exclude<RichTextContent, undefined>;

export function normalizeRichTextContent(content: RichTextContent): NormalizedRichTextContent {
  if (content === undefined) return null;
  if (!isRichTextNode(content)) return content;

  return normalizeRichTextNode(content);
}

function isRichTextNode(content: RichTextContent): content is RichTextNode {
  return typeof content === "object" && content !== null && !Array.isArray(content);
}

function normalizeRichTextNode(node: RichTextNode, autoLink = true): RichTextNode {
  if (!Array.isArray(node.content)) return node;

  const children = node.content;
  const autoLinkChildren = autoLink && node.type !== "codeBlock";
  const normalizedChildren = children
    .filter((child) => child.type !== "text" || child.text !== "")
    .flatMap((child) => normalizeRichTextChild(child, autoLinkChildren));
  const contentChanged =
    normalizedChildren.length !== children.length ||
    normalizedChildren.some((child, index) => child !== children[index]);

  return contentChanged ? { ...node, content: normalizedChildren } : node;
}

function normalizeRichTextChild(node: RichTextNode, autoLink: boolean): RichTextNode[] {
  if (node.type === "text") return autoLinkTextNode(node, autoLink);
  return [normalizeRichTextNode(node, autoLink)];
}

function autoLinkTextNode(node: RichTextNode, autoLink: boolean): RichTextNode[] {
  if (!autoLink || !node.text || hasMark(node, "link") || hasMark(node, "code")) return [node];

  const markdownLinkRanges = findMarkdownLinkRanges(node.text);
  const matches = find(node.text).filter(
    (match) =>
      match.isLink && isAllowedUri(match.href) && !markdownLinkRanges.some((range) => rangesOverlap(range, match)),
  );
  if (matches.length === 0) return [node];

  const nodes: RichTextNode[] = [];
  let offset = 0;

  for (const match of matches) {
    if (match.start > offset) nodes.push({ ...node, text: node.text.slice(offset, match.start) });

    nodes.push({
      ...node,
      text: node.text.slice(match.start, match.end),
      marks: [...(node.marks ?? []), { type: "link", attrs: { href: match.href } }],
    });
    offset = match.end;
  }

  if (offset < node.text.length) nodes.push({ ...node, text: node.text.slice(offset) });
  return nodes;
}

interface TextRange {
  start: number;
  end: number;
}

function findMarkdownLinkRanges(text: string): TextRange[] {
  return Array.from(text.matchAll(MARKDOWN_LINK_REGEX), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
}

function rangesOverlap(a: TextRange, b: TextRange): boolean {
  return a.start < b.end && b.start < a.end;
}

function hasMark(node: RichTextNode, type: string): boolean {
  return node.marks?.some((mark) => mark.type === type) ?? false;
}
