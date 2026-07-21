import type { Node } from "@tiptap/pm/model";
import { DecorationSet, Decoration } from "@tiptap/pm/view";

import type { RichContentChange } from "./types";

export type DiffDecorationSide = "before" | "after";

type NodeDecorationRange = {
  from: number;
  to: number;
  kind: "block" | "leaf";
};

/**
 * Build ProseMirror decorations for one side of a split diff.
 * Does not mutate document JSON — decorations are presentation-only.
 */
export function buildDiffDecorations(doc: Node, changes: RichContentChange[], side: DiffDecorationSide): DecorationSet {
  const decorations: Decoration[] = [];
  const decoratedNodes = new Set<string>();

  for (const change of changes) {
    if (!appliesToSide(change, side)) continue;

    const range = rangeForSide(change, side);
    const from = clamp(range.from, 0, doc.content.size);
    const to = clamp(range.to, from, doc.content.size);
    if (to <= from) continue;

    const className = side === "before" ? "diff-removed" : "diff-added";
    const label = side === "before" ? "Removed" : "Added";
    const attributes = {
      class: className,
      "data-diff": label.toLowerCase(),
      "aria-label": label,
    };
    const nodeRanges = classifyNodeRanges(doc, from, to);

    if (nodeRanges.length > 0) {
      for (const nodeRange of nodeRanges) {
        const key = `${nodeRange.from}:${nodeRange.to}`;
        if (decoratedNodes.has(key)) continue;

        decoratedNodes.add(key);
        decorations.push(
          Decoration.node(nodeRange.from, nodeRange.to, {
            ...attributes,
            class: nodeRange.kind === "block" ? `${className} ${className}-block` : className,
          }),
        );
      }
      continue;
    }

    decorations.push(Decoration.inline(from, to, attributes));
  }

  return DecorationSet.create(doc, decorations);
}

function appliesToSide(change: RichContentChange, side: DiffDecorationSide): boolean {
  if (side === "before") {
    return change.kind === "deletion" || change.kind === "replacement";
  }

  return change.kind === "addition" || change.kind === "replacement";
}

function rangeForSide(change: RichContentChange, side: DiffDecorationSide): { from: number; to: number } {
  return side === "before" ? { from: change.fromA, to: change.toA } : { from: change.fromB, to: change.toB };
}

/**
 * Token-level diffs can point at a node's opening or closing token rather than
 * its content. Classify those ranges explicitly instead of resolving an
 * ancestor at depth zero, which has no position before it in ProseMirror.
 */
function classifyNodeRanges(doc: Node, from: number, to: number): NodeDecorationRange[] {
  const nodeAtStart = doc.nodeAt(from);

  if (nodeAtStart && !nodeAtStart.isText) {
    const nodeTo = from + nodeAtStart.nodeSize;
    const openingTokenChanged = to === from + 1 && !nodeAtStart.isLeaf;

    if (openingTokenChanged) {
      return [
        {
          from,
          to: nodeTo,
          kind: "block",
        },
      ];
    }

    const completeNodes = findCompleteNodes(doc, from, to);
    if (completeNodes.length > 0) {
      return completeNodes;
    }
  }

  if (to === from + 1) {
    const nodeEndingAtRange = findOutermostBlockEndingAt(doc, to);
    if (nodeEndingAtRange) return [nodeEndingAtRange];
  }

  return [];
}

function findCompleteNodes(doc: Node, from: number, to: number): NodeDecorationRange[] {
  const ranges: NodeDecorationRange[] = [];
  let position = from;

  while (position < to) {
    const node = doc.nodeAt(position);
    if (!node || node.isText) return [];

    const nodeTo = position + node.nodeSize;
    if (nodeTo > to) return [];

    ranges.push({
      from: position,
      to: nodeTo,
      kind: node.isLeaf ? "leaf" : "block",
    });
    position = nodeTo;
  }

  return position === to ? ranges : [];
}

function findOutermostBlockEndingAt(doc: Node, end: number): NodeDecorationRange | null {
  let match: NodeDecorationRange | null = null;

  doc.descendants((node, pos) => {
    if (!node.isBlock || pos + node.nodeSize !== end) return;

    if (!match || pos < match.from) {
      match = { from: pos, to: end, kind: "block" };
    }
  });

  return match;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
