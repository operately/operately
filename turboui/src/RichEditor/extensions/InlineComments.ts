import { Extension } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { closeHistory, isHistoryTransaction } from "@tiptap/pm/history";
import { Step, StepResult, type Mappable } from "@tiptap/pm/transform";
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

type State = { ranges: InlineCommentRange[]; baseline: object; activeThreadId?: string | null };
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

// Install commands once; the hook can enable/disable the plugin without recreating the editor.
export const InlineCommentCommands = Extension.create({
  name: "inlineCommentCommands",
  addCommands() {
    return {
      setInlineCommentRanges:
        (ranges) =>
        ({ tr, dispatch, state }) => {
          if (!inlineCommentsKey.getState(state)) return false;
          if (dispatch) tr.setMeta(inlineCommentsKey, { ...tr.getMeta(inlineCommentsKey), ranges });
          return true;
        },
      setActiveInlineThread:
        (activeThreadId) =>
        ({ tr, dispatch, state }) => {
          if (!inlineCommentsKey.getState(state)) return false;
          if (dispatch) tr.setMeta(inlineCommentsKey, { ...tr.getMeta(inlineCommentsKey), activeThreadId });
          return true;
        },
    };
  },
});

// Decorations belong to plugin state, never to the document schema or clipboard.
export const InlineComments = InlineCommentCommands.extend<InlineCommentsOptions>({
  name: "inlineComments",
  addOptions: () => ({ ranges: [] }),
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
        baseline: {},
        activeThreadId: options.activeThreadId,
      }),
      apply(tr, previous) {
        const update: Update | undefined = tr.getMeta(inlineCommentsKey);
        let next = previous;

        if (update?.ranges) {
          next = { ...previous, ranges: update.ranges.filter((range) => validRange(tr.doc, range)), baseline: {} };
        } else if (tr.docChanged && tr.getMeta("preventUpdate") !== undefined) {
          // Tiptap setContent replaces the document; old ranges and undo snapshots no longer apply.
          next = { ...previous, ranges: [], baseline: {} };
        } else if (tr.docChanged) {
          const recovery = isHistoryTransaction(tr)
            ? tr.steps
                .filter(
                  (step): step is InlineCommentRangesStep =>
                    step instanceof InlineCommentRangesStep && step.baseline === previous.baseline,
                )
                .at(-1)
            : undefined;
          next = {
            ...previous,
            ranges: recovery
              ? recovery.after.filter((range) => validRange(tr.doc, range))
              : mapRanges(previous.ranges, tr),
          };
        }

        if (update && "activeThreadId" in update) next = { ...next, activeThreadId: update.activeThreadId };
        return next;
      },
    },
    appendTransaction(transactions, oldState, newState) {
      const before = inlineCommentsKey.getState(oldState);
      const after = inlineCommentsKey.getState(newState);

      if (!before || !after) return null;
      if (before.baseline !== after.baseline) return closeHistory(newState.tr).setMeta("addToHistory", false);
      if (!transactions.some((tr) => tr.docChanged) || transactions.some(isHistoryTransaction)) return null;
      if (transactions.some((tr) => tr.getMeta("addToHistory") === false)) return null;
      if (sameRanges(before.ranges, after.ranges)) return null;

      // History groups this document-neutral step with the edit and prunes it with that event.
      return newState.tr.step(new InlineCommentRangesStep(before.ranges, after.ranges, after.baseline));
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

function sameRanges(a: InlineCommentRange[], b: InlineCommentRange[]): boolean {
  return (
    a.length === b.length &&
    a.every((range, i) => range.id === b[i]?.id && range.from === b[i]?.from && range.to === b[i]?.to)
  );
}

function mapRanges(previous: InlineCommentRange[], tr: Transaction): InlineCommentRange[] {
  const ranges: InlineCommentRange[] = [];
  for (const range of previous) {
    const mapped = mapRange(range, tr);
    if (mapped && validRange(tr.doc, mapped)) ranges.push(mapped);
  }
  return ranges;
}

// Range changes live in ProseMirror's history, not in a separate document snapshot cache.
class InlineCommentRangesStep extends Step {
  constructor(
    readonly before: InlineCommentRange[],
    readonly after: InlineCommentRange[],
    readonly baseline: object | null,
  ) {
    super();
  }

  apply(doc: Node): StepResult {
    return StepResult.ok(doc);
  }

  invert(): InlineCommentRangesStep {
    return new InlineCommentRangesStep(this.after, this.before, this.baseline);
  }

  map(mapping: Mappable): InlineCommentRangesStep {
    const remap = (ranges: InlineCommentRange[]) =>
      ranges.flatMap((range) => {
        const from = mapping.mapResult(range.from, 1);
        const to = mapping.mapResult(range.to, -1);
        return from.pos < to.pos && !(from.deleted && to.deleted) ? [{ ...range, from: from.pos, to: to.pos }] : [];
      });
    return new InlineCommentRangesStep(remap(this.before), remap(this.after), this.baseline);
  }

  // Range history is editor-local; serialized steps contain no comment data.
  toJSON() {
    return { stepType: "operatelyInlineCommentRanges" };
  }
  static fromJSON(): InlineCommentRangesStep {
    return new InlineCommentRangesStep([], [], null);
  }
}

Step.jsonID("operatelyInlineCommentRanges", InlineCommentRangesStep);

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
