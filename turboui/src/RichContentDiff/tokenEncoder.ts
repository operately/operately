import type { Mark, Node } from "@tiptap/pm/model";
import type { TokenEncoder } from "@tiptap/pm/changeset";

const IGNORED_MARKS = new Set(["fakeTextSelection"]);

const BLOB_IGNORED_ATTRS = new Set(["progress", "status"]);

/**
 * Semantic token encoder for Operately TipTap documents.
 * Deterministic and DOM-independent — suitable for fixture tests and workers.
 */
export const operatelyTokenEncoder: TokenEncoder<string> = {
  encodeCharacter(char, marks) {
    return `c:${char}:${encodeMarks(marks)}`;
  },

  encodeNodeStart(node) {
    return `ns:${node.type.name}:${encodeNodeAttrs(node)}`;
  },

  encodeNodeEnd(node) {
    return `ne:${node.type.name}`;
  },

  compareTokens(a, b) {
    return a === b;
  },
};

function encodeMarks(marks: readonly Mark[]): string {
  const parts = marks
    .filter((mark) => !IGNORED_MARKS.has(mark.type.name))
    .map((mark) => `${mark.type.name}:${stableStringify(normalizeAttrs(mark.attrs))}`)
    .sort();

  return parts.join("|");
}

function encodeNodeAttrs(node: Node): string {
  const attrs = normalizeNodeAttrs(node);
  return stableStringify(attrs);
}

function normalizeNodeAttrs(node: Node): Record<string, unknown> {
  const name = node.type.name;
  const attrs = { ...node.attrs };

  if (name === "blob") {
    return normalizeBlobAttrs(attrs);
  }

  if (name === "mention") {
    return pick(attrs, ["id", "label"]);
  }

  if (name === "heading") {
    return pick(attrs, ["level"]);
  }

  if (name === "orderedList") {
    return pick(attrs, ["start", "order"]);
  }

  if (name === "link" || attrs.href != null) {
    // Link is a mark; node path unused. Keep for safety if link appears as node.
    return pick(attrs, ["href"]);
  }

  // Default: include all attrs except undefined/null with stable key order.
  return normalizeAttrs(attrs);
}

function normalizeBlobAttrs(attrs: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(attrs).sort()) {
    if (BLOB_IGNORED_ATTRS.has(key)) continue;

    // Prefer stable blob id; ignore regenerated/temporary URLs when id is present.
    if (key === "src" && attrs.id) continue;

    const value = attrs[key];
    if (value === undefined || value === null) continue;
    result[key] = value;
  }

  return result;
}

function normalizeAttrs(attrs: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(attrs).sort()) {
    const value = attrs[key];
    if (value === undefined) continue;
    result[key] = value;
  }

  return result;
}

function pick(attrs: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of keys.sort()) {
    if (attrs[key] === undefined || attrs[key] === null) continue;
    result[key] = attrs[key];
  }

  return result;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(",")}}`;
}
