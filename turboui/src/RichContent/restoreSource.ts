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
    const restored = joinGeneratedLabels(children).map(restoreNode);
    if (restored.length !== children.length || restored.some((child, i) => child !== children[i])) {
      node = { ...node, content: restored };
    }
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

// Formatting can split a generated label into adjacent text nodes. Recognize
// the complete unchanged title before deciding that its text was customized.
function joinGeneratedLabels(children: unknown[]): unknown[] {
  const result: unknown[] = [];
  for (let index = 0; index < children.length; index++) {
    const first = children[index];
    const link = generatedLink(first);
    if (!link || !isObject(first) || !isUrlLabel(link.originalText, link.href)) {
      result.push(first);
      continue;
    }
    let text = String(first.text);
    let end = index;
    while (text.length < link.resolvedText.length) {
      const next = children[end + 1];
      const nextLink = generatedLink(next);
      if (!nextLink || !isObject(next) || JSON.stringify(nextLink) !== JSON.stringify(link)) break;
      text += next.text;
      end++;
    }
    if (end > index && text === link.resolvedText) {
      // Combine formatting from split generated titles so it applies to the
      // whole link when the original URL is restored.
      const marks = new Map<string, unknown>();
      for (const child of children.slice(index, end + 1)) {
        if (!isObject(child) || !Array.isArray(child.marks)) continue;
        for (const mark of child.marks) {
          if (isObject(mark) && typeof mark.type === "string" && !marks.has(mark.type)) marks.set(mark.type, mark);
        }
      }
      result.push({ ...first, text, marks: [...marks.values()] });
      index = end;
    } else {
      result.push(first);
    }
  }
  return result;
}

function generatedLink(node: unknown): { href: string; originalText: string; resolvedText: string } | null {
  if (!isObject(node) || node.type !== "text" || typeof node.text !== "string" || !Array.isArray(node.marks))
    return null;
  for (const mark of node.marks) {
    if (!isObject(mark) || mark.type !== "link" || !isObject(mark.attrs)) continue;
    const metadata = mark.attrs.operatelyResourceLink;
    if (
      typeof mark.attrs.href === "string" &&
      isObject(metadata) &&
      typeof metadata.originalText === "string" &&
      typeof metadata.resolvedText === "string"
    ) {
      return { href: mark.attrs.href, originalText: metadata.originalText, resolvedText: metadata.resolvedText };
    }
  }
  return null;
}

export function isUrlLabel(text: string, href: string): boolean {
  try {
    const label = new URL(text.trim(), "https://resource-link.invalid");
    const link = new URL(href.trim(), "https://resource-link.invalid");
    label.hash = "";
    link.hash = "";
    if (label.href.replace(/\/$/, "") === link.href.replace(/\/$/, "")) return true;
    if (text.trim().replace(/\/$/, "") === link.pathname.replace(/\/$/, "")) return true;
    link.search = "";
    return label.href.replace(/\/$/, "") === link.href.replace(/\/$/, "");
  } catch {
    return text.trim() === href.trim();
  }
}
