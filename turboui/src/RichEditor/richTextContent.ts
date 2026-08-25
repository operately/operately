export interface RichTextNode {
  type: string;
  text?: string;
  content?: RichTextNode[];
  [key: string]: unknown;
}

export type RichTextContent = RichTextNode | RichTextNode[] | string | null | undefined;

export function normalizeRichTextContent(content: RichTextContent): RichTextContent {
  if (!isRichTextNode(content)) return content;

  return normalizeRichTextNode(content);
}

function isRichTextNode(content: RichTextContent): content is RichTextNode {
  return typeof content === "object" && content !== null && !Array.isArray(content);
}

function normalizeRichTextNode(node: RichTextNode): RichTextNode {
  if (!Array.isArray(node.content)) return node;

  const children = node.content;
  const normalizedChildren = children
    .filter((child) => child.type !== "text" || child.text !== "")
    .map(normalizeRichTextNode);
  const contentChanged =
    normalizedChildren.length !== children.length ||
    normalizedChildren.some((child, index) => child !== children[index]);

  return contentChanged ? { ...node, content: normalizedChildren } : node;
}
