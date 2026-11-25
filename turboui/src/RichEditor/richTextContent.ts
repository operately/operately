import { isAllowedUri } from "@tiptap/extension-link";
import { find } from "linkifyjs";
import { AUTO_LINK_SUPPRESSION_MARK } from "./extensions/Link/AutoLinkSuppression";

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
  const nonEmptyChildren = children.filter((child) => child.type !== "text" || child.text !== "");
  const normalizedChildren = normalizeRichTextChildren(nonEmptyChildren, autoLinkChildren);
  const contentChanged =
    normalizedChildren.length !== children.length ||
    normalizedChildren.some((child, index) => child !== children[index]);

  return contentChanged ? { ...node, content: normalizedChildren } : node;
}

function normalizeRichTextChildren(children: RichTextNode[], autoLink: boolean): RichTextNode[] {
  const normalizedChildren: RichTextNode[] = [];
  let textRun: RichTextNode[] = [];

  const flushTextRun = () => {
    normalizedChildren.push(...autoLinkTextNodes(textRun));
    textRun = [];
  };

  for (const source of children) {
    const child = stripTemporarySelection(source);
    if (isAutoLinkableTextNode(child, autoLink)) {
      textRun.push(child);
      continue;
    }

    flushTextRun();
    normalizedChildren.push(child.type === "text" ? child : normalizeRichTextNode(child, autoLink));
  }

  flushTextRun();
  return normalizedChildren;
}

function stripTemporarySelection(node: RichTextNode): RichTextNode {
  if (!node.marks?.some((mark) => mark.type === "fakeTextSelection")) return node;

  const marks = node.marks.filter((mark) => mark.type !== "fakeTextSelection");
  return { ...node, marks: marks.length ? marks : undefined };
}

function isAutoLinkableTextNode(node: RichTextNode, autoLink: boolean): boolean {
  return (
    autoLink &&
    node.type === "text" &&
    !!node.text &&
    !hasMark(node, "link") &&
    !hasMark(node, "code") &&
    !hasMark(node, AUTO_LINK_SUPPRESSION_MARK)
  );
}

function autoLinkTextNodes(nodes: RichTextNode[]): RichTextNode[] {
  if (nodes.length === 0) return nodes;

  const text = nodes.map((node) => node.text).join("");
  const markdownLinkRanges = findMarkdownLinkRanges(text);
  const matches: AutoLinkMatch[] = find(text)
    .filter(
      (match) =>
        match.isLink && isAllowedUri(match.href) && !markdownLinkRanges.some((range) => rangesOverlap(range, match)),
    )
    .map((match) => ({ start: match.start, end: match.end, href: match.href }));
  if (matches.length === 0) return nodes;

  let nodeStart = 0;
  return nodes.flatMap((node) => {
    const linkedNodes = applyAutoLinks(node, nodeStart, matches);
    nodeStart += node.text?.length ?? 0;
    return linkedNodes;
  });
}

function applyAutoLinks(node: RichTextNode, nodeStart: number, matches: AutoLinkMatch[]): RichTextNode[] {
  const text = node.text ?? "";
  const nodeEnd = nodeStart + text.length;
  const overlappingMatches = matches.filter((match) => match.start < nodeEnd && nodeStart < match.end);
  if (overlappingMatches.length === 0) return [node];

  const linkedNodes: RichTextNode[] = [];
  let offset = 0;

  for (const match of overlappingMatches) {
    const matchStart = Math.max(match.start - nodeStart, 0);
    const matchEnd = Math.min(match.end - nodeStart, text.length);

    if (matchStart > offset) linkedNodes.push({ ...node, text: text.slice(offset, matchStart) });

    linkedNodes.push({
      ...node,
      text: text.slice(matchStart, matchEnd),
      marks: [...(node.marks ?? []), { type: "link", attrs: { href: match.href } }],
    });
    offset = matchEnd;
  }

  if (offset < text.length) linkedNodes.push({ ...node, text: text.slice(offset) });
  return linkedNodes;
}

interface TextRange {
  start: number;
  end: number;
}

interface AutoLinkMatch extends TextRange {
  href: string;
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
