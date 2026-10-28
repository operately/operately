import { Extension } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { Plugin, PluginKey, TextSelection, type Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type InlineCommentRange = { id: string; from: number; to: number };
export type InlineCommentSelection = { from: number; to: number; quote: string };
export interface InlineCommentsOptions {
  ranges: InlineCommentRange[];
  activeThreadId?: string | null;
  onSelectionChange?: (selection: InlineCommentSelection | null) => void;
  onThreadClick?: (threadIds: string[]) => void;
}

type RangeSnapshot = { ranges: InlineCommentRange[]; doc: Node };
type State = { ranges: InlineCommentRange[]; snapshots: RangeSnapshot[]; activeThreadId?: string | null };
type Update = { ranges?: InlineCommentRange[]; activeThreadId?: string | null };

export const inlineCommentsKey = new PluginKey<State>("inlineComments");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineComments: {
      setInlineCommentRanges: (ranges: InlineCommentRange[]) => ReturnType;
      setActiveInlineThread: (id: string | null) => ReturnType;
    };
  }
}

// Decorations belong to plugin state, never to the document schema or clipboard.
export const InlineComments = Extension.create<InlineCommentsOptions>({
  name: "inlineComments",
  addOptions: () => ({ ranges: [] }),
  addCommands() {
    return {
      setInlineCommentRanges:
        (ranges) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(inlineCommentsKey, { ...tr.getMeta(inlineCommentsKey), ranges });
          return true;
        },
      setActiveInlineThread:
        (activeThreadId) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(inlineCommentsKey, { ...tr.getMeta(inlineCommentsKey), activeThreadId });
          return true;
        },
    };
  },
  addProseMirrorPlugins() {
    return [createInlineCommentsPlugin(this.options)];
  },
});

export function createInlineCommentsPlugin(options: InlineCommentsOptions): Plugin<State> {
  return new Plugin<State>({
    key: inlineCommentsKey,
    state: {
      init: (_, state) => ({
        ranges: options.ranges.filter((range) => validRange(state.doc, range)),
        snapshots: [],
        activeThreadId: options.activeThreadId,
      }),
      apply(tr, previous, oldState) {
        const update: Update | undefined = tr.getMeta(inlineCommentsKey);
        let next = previous;

        if (update?.ranges) {
          next = { ...previous, ranges: update.ranges.filter((range) => validRange(tr.doc, range)), snapshots: [] };
        } else if (tr.docChanged && tr.getMeta("preventUpdate") !== undefined) {
          // Tiptap setContent replaces the document; old ranges and undo snapshots no longer apply.
          next = { ...previous, ranges: [], snapshots: [] };
        } else if (tr.docChanged) {
          next = mapRanges(previous, tr, oldState.doc);
        }

        if (update && "activeThreadId" in update) next = { ...next, activeThreadId: update.activeThreadId };
        return next;
      },
    },
    props: {
      decorations(state) {
        const current = inlineCommentsKey.getState(state);
        return DecorationSet.create(
          state.doc,
          (current?.ranges ?? []).map((range) =>
            Decoration.inline(range.from, range.to, {
              "data-inline-thread": range.id,
              class:
                range.id === current?.activeThreadId
                  ? "bg-surface-highlight border-b-2 border-content-accent"
                  : "bg-surface-bg-highlight border-b border-content-subtle",
            }),
          ),
        );
      },
      handleClick(view, pos) {
        const ids =
          inlineCommentsKey
            .getState(view.state)
            ?.ranges.filter((range) => range.from <= pos && pos < range.to)
            .map((range) => range.id) ?? [];
        if (ids.length) options.onThreadClick?.(ids);
        return false;
      },
    },
    view: () => ({
      update(view, previous) {
        if (previous.selection.eq(view.state.selection) && previous.doc.eq(view.state.doc)) return;
        const { selection, doc } = view.state;
        if (!(selection instanceof TextSelection) || selection.empty) {
          options.onSelectionChange?.(null);
          return;
        }
        const { from, to } = selection;
        const quote = selectedText(doc, from, to);
        options.onSelectionChange?.(quote ? { from, to, quote } : null);
      },
    }),
  });
}

function mapRanges(previous: State, tr: Transaction, oldDoc: Node): State {
  if (previous.ranges.length === 0 && previous.snapshots.length === 0) return previous;

  // Undo can combine several transactions, including edits outside a range.
  // Remember all ranges for each body so that grouped undo restores exact boundaries.
  const snapshots = [
    { doc: oldDoc, ranges: previous.ranges },
    ...previous.snapshots.filter((snapshot) => !snapshot.doc.eq(oldDoc)),
  ];
  const restored = snapshots.find((snapshot) => snapshot.doc.eq(tr.doc));
  if (restored) return { ...previous, ranges: restored.ranges, snapshots };

  const ranges: InlineCommentRange[] = [];
  for (const range of previous.ranges) {
    const mapped = mapRange(range, tr);
    if (mapped && validRange(tr.doc, mapped)) ranges.push(mapped);
  }

  return { ...previous, ranges, snapshots };
}

function mapRange(range: InlineCommentRange, tr: Transaction): InlineCommentRange | null {
  let { from, to } = range;

  for (const map of tr.mapping.maps) {
    let deleted = false;
    map.forEach((start, end) => {
      if (start <= from && end >= to && start < end) deleted = true;
    });
    if (deleted) return null;
    from = map.map(from, 1);
    to = map.map(to, -1);
    if (from >= to) return null;
  }

  return { ...range, from, to };
}

function validRange(doc: Node, { from, to }: InlineCommentRange): boolean {
  return (
    Number.isInteger(from) &&
    Number.isInteger(to) &&
    from >= 0 &&
    from < to &&
    to <= doc.content.size &&
    validBoundary(doc, from) &&
    validBoundary(doc, to) &&
    selectedText(doc, from, to) !== ""
  );
}

function validBoundary(doc: Node, pos: number): boolean {
  const before = doc.textBetween(Math.max(0, pos - 1), pos);
  const after = doc.textBetween(pos, Math.min(doc.content.size, pos + 1));

  return !(/[\uD800-\uDBFF]$/.test(before) && /^[\uDC00-\uDFFF]/.test(after));
}

function selectedText(doc: Node, from: number, to: number): string {
  return doc.textBetween(from, to, "\n", (node) => (node.type.name === "hardBreak" ? "\n" : "\uFFFC"));
}
