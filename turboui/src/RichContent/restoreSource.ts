/** Recover editable source from response-only title metadata without fetching resources. */
export function restoreRichTextSource<T>(content: T): T {
  return restoreValue(content) as T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function restoreValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (!/^[\s]*[\[{]/.test(value)) return value;
    try {
      const parsed: unknown = JSON.parse(value);
      const restored = restoreValue(parsed);
      return restored === parsed ? value : JSON.stringify(restored);
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) {
    const restored = value.map(restoreValue);
    return restored.every((item, i) => item === value[i]) ? value : restored;
  }
  if (!isObject(value)) return value;
  if (value.type === "doc" && Array.isArray(value.content)) return restoreNode(value);
  return value;
}

function restoreNode(value: unknown): unknown {
  if (!isObject(value)) return value;
  let node = value;
  if (Array.isArray(node.content)) {
    const children = node.content;
    const restored = children.map(restoreNode);
    if (restored.some((child, i) => child !== children[i])) node = { ...node, content: restored };
  }
  if (node.type !== "text" || !Array.isArray(node.marks)) return node;

  let text = node.text;
  let changed = false;
  const marks = node.marks.map((mark: unknown) => {
    if (!isObject(mark) || mark.type !== "link" || !isObject(mark.attrs)) return mark;
    if (!("operatelyResourceLink" in mark.attrs)) return mark;
    const { operatelyResourceLink: metadata, ...attrs } = mark.attrs;
    if (
      isObject(metadata) &&
      text === metadata.resolvedText &&
      typeof metadata.originalText === "string" &&
      typeof attrs.href === "string" &&
      isUrlLabel(metadata.originalText, attrs.href)
    ) {
      text = metadata.originalText;
    }
    changed = true;
    return { ...mark, attrs };
  });
  return changed ? { ...node, text, marks } : node;
}

function isUrlLabel(text: string, href: string): boolean {
  try {
    const label = new URL(text.trim(), "https://resource-link.invalid");
    const link = new URL(href.trim(), "https://resource-link.invalid");
    label.hash = "";
    link.hash = "";
    if (label.href.replace(/\/$/, "") === link.href.replace(/\/$/, "")) return true;
    link.search = "";
    return label.href.replace(/\/$/, "") === link.href.replace(/\/$/, "");
  } catch {
    return text.trim() === href.trim();
  }
}
