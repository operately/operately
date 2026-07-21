import type { Node } from "@tiptap/pm/model";
import { DecorationSet, Decoration } from "@tiptap/pm/view";

import type { RichContentChange } from "./types";

export type DiffDecorationSide = "before" | "after";

/**
 * Build ProseMirror decorations for one side of a split diff.
 * Does not mutate document JSON — decorations are presentation-only.
 */
export function buildDiffDecorations(doc: Node, changes: RichContentChange[], side: DiffDecorationSide): DecorationSet {
  const decorations: Decoration[] = [];

  for (const change of changes) {
    const from = side === "before" ? change.fromA : change.fromB;
    const to = side === "before" ? change.toA : change.toB;

    if (to <= from) continue;

    const applies =
      (side === "before" && (change.kind === "deletion" || change.kind === "replacement")) ||
      (side === "after" && (change.kind === "addition" || change.kind === "replacement"));

    if (!applies) continue;

    const className = side === "before" ? "diff-removed" : "diff-added";
    const label = side === "before" ? "Removed" : "Added";
    const expanded = expandToNearestBlock(doc, from, to);

    if (expanded.isBlock) {
      const node = doc.nodeAt(expanded.from);
      if (node) {
        decorations.push(
          Decoration.node(expanded.from, expanded.from + node.nodeSize, {
            class: `${className} ${className}-block`,
            "data-diff": label.toLowerCase(),
            "aria-label": label,
          }),
        );
      }
    }

    const inlineFrom = Math.max(expanded.from, from);
    const inlineTo = Math.min(expanded.to, to);
    if (inlineTo > inlineFrom) {
      decorations.push(
        Decoration.inline(inlineFrom, inlineTo, {
          class: className,
          "data-diff": label.toLowerCase(),
          "aria-label": label,
        }),
      );
    } else if (!expanded.isBlock && expanded.to > expanded.from) {
      decorations.push(
        Decoration.inline(expanded.from, expanded.to, {
          class: className,
          "data-diff": label.toLowerCase(),
          "aria-label": label,
        }),
      );
    }
  }

  return DecorationSet.create(doc, decorations);
}

function expandToNearestBlock(
  doc: Node,
  from: number,
  to: number,
): { from: number; to: number; isBlock: boolean } {
  const safeTo = Math.min(to, doc.content.size);
  const safeFrom = Math.min(from, safeTo);
  const $from = doc.resolve(safeFrom);
  const $to = doc.resolve(safeTo);

  const blockRange = $from.blockRange($to);
  if (!blockRange) {
    return { from: safeFrom, to: safeTo, isBlock: false };
  }

  let depth = blockRange.depth;
  while (depth > 0 && !$from.node(depth).isBlock) {
    depth -= 1;
  }

  const blockNode = $from.node(depth);
  const blockPos = $from.before(depth);
  const textLength = textSizeBetween(doc, safeFrom, safeTo);
  const spansWholeBlock = safeFrom <= blockPos + 1 && safeTo >= blockPos + blockNode.nodeSize - 1;

  if (textLength === 0 || spansWholeBlock) {
    return { from: blockPos, to: blockPos + blockNode.nodeSize, isBlock: true };
  }

  return { from: safeFrom, to: safeTo, isBlock: false };
}

function textSizeBetween(doc: Node, from: number, to: number): number {
  let size = 0;
  doc.nodesBetween(from, to, (node) => {
    if (node.isText && node.text) {
      size += node.text.length;
    }
  });
  return size;
}
