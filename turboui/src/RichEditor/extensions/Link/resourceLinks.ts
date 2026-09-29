import { closeHistory, isHistoryTransaction } from "@tiptap/pm/history";
import { getMarkRange } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
import { AddMarkStep, Mapping, RemoveMarkStep } from "@tiptap/pm/transform";
import type { EditorView } from "@tiptap/pm/view";
import { isUrlLabel } from "../../../RichContent/restoreSource";

export type ResolveResourceLinks = (urls: string[]) => Promise<{ url: string; title: string }[]>;

type Candidate = {
  id: number;
  from: number;
  to: number;
  node: Node;
  url: string;
  status: "queued" | "pending" | "done";
};

type LookupState = { candidates: Candidate[]; nextId: number };
type LookupAction = { ids: number[]; status: "pending" | "done" };
const lookupKey = new PluginKey<LookupState>("resourceLinkTitles");
const BATCH_SIZE = 100;
const DEBOUNCE_MS = 150;

/** Track individual link occurrences so asynchronous replies cannot overwrite subsequent edits. */
export function createResourceLinkPlugin(resolve: ResolveResourceLinks): Plugin<LookupState> {
  return new Plugin<LookupState>({
    key: lookupKey,
    state: {
      init: (_, state) => scanLinks(state.doc, { candidates: [], nextId: 0 }),
      apply: (tr, previous) => {
        const action: LookupAction | undefined = tr.getMeta(lookupKey);
        const candidates = previous.candidates.flatMap((candidate) => {
          const mapped = mapCandidate(candidate, tr);
          if (!mapped) return [];
          return [{ ...mapped, status: action?.ids.includes(mapped.id) ? action.status : mapped.status }];
        });
        const next = { candidates, nextId: previous.nextId };
        return tr.docChanged ? scanLinks(tr.doc, next, isHistoryTransaction(tr)) : next;
      },
    },
    appendTransaction: (transactions, _previous, state) => {
      if (transactions.some(isHistoryTransaction)) return null;
      const tr = state.tr;
      expandGeneratedLinkFormatting(transactions, tr);
      return tr.docChanged ? tr : null;
    },
    view: (view) => new LinkLookup(view, resolve),
  });
}

/**
 * Apply formatting added to or removed from part of a generated title to the whole link.
 * Generated titles are restored to URLs when saved, so partial formatting cannot be
 * mapped reliably between the title and URL. Custom labels keep their partial formatting.
 */
function expandGeneratedLinkFormatting(transactions: readonly Transaction[], result: Transaction) {
  transactions.forEach((transaction, transactionIndex) => {
    transaction.steps.forEach((step, stepIndex) => {
      if (!(step instanceof AddMarkStep || step instanceof RemoveMarkStep) || step.mark.type.name === "link") return;
      const doc = transaction.docs[stepIndex];
      if (!doc) return;
      const mapping = new Mapping(transaction.mapping.maps.slice(stepIndex + 1));
      for (const later of transactions.slice(transactionIndex + 1)) mapping.appendMapping(later.mapping);

      doc.nodesBetween(step.from, step.to, (node, position) => {
        if (!node.isText) return;
        const link = node.marks.find((mark) => mark.type.name === "link");
        const metadata = link?.attrs.operatelyResourceLink;
        if (
          !link ||
          typeof metadata?.originalText !== "string" ||
          typeof metadata?.resolvedText !== "string" ||
          typeof link.attrs.href !== "string" ||
          !isUrlLabel(metadata.originalText, link.attrs.href) ||
          step.mark.type.excludes(link.type) ||
          link.type.excludes(step.mark.type)
        )
          return;

        const range = getMarkRange(doc.resolve(position), link.type, link.attrs);
        if (!range || doc.textBetween(range.from, range.to) !== metadata.resolvedText) return;
        const from = mapping.map(range.from, 1);
        const to = mapping.map(range.to, -1);
        if (from >= to || result.doc.textBetween(from, to) !== metadata.resolvedText) return;
        const current = getMarkRange(result.doc.resolve(from), link.type, link.attrs);
        if (!current || current.from !== from || current.to !== to) return;

        if (step instanceof AddMarkStep) result.addMark(from, to, step.mark);
        else result.removeMark(from, to, step.mark);
      });
    });
  });
}

function mapCandidate(candidate: Candidate, tr: Transaction): Candidate | null {
  const from = tr.mapping.mapResult(candidate.from, 1);
  const to = tr.mapping.mapResult(candidate.to, -1);
  if (from.deleted || to.deleted || to.pos - from.pos !== candidate.node.nodeSize) return null;
  if (!tr.doc.nodeAt(from.pos)?.eq(candidate.node)) return null;
  return { ...candidate, from: from.pos, to: to.pos };
}

function scanLinks(doc: Node, previous: LookupState, undone = false): LookupState {
  const candidates = [...previous.candidates];
  let nextId = previous.nextId;
  const positions = new Set(candidates.map((candidate) => candidate.from));
  doc.descendants((node, from) => {
    if (node.type.spec.code) return false;

    if (!node.isText || !node.text || positions.has(from) || node.marks.some((mark) => mark.type.spec.code))
      return true;
    const url: unknown = node.marks.find((mark) => mark.type.name === "link")?.attrs.href;

    if (typeof url !== "string" || !isInternalLink(url) || !isUrlLabel(node.text, url)) return true;
    candidates.push({ id: nextId++, from, to: from + node.nodeSize, node, url, status: undone ? "done" : "queued" });

    return true;
  });
  return { candidates, nextId };
}

function isInternalLink(url: string): boolean {
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

class LinkLookup {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private destroyed = false;

  constructor(
    private view: EditorView,
    private resolve: ResolveResourceLinks,
  ) {
    this.update();
  }

  update() {
    clearTimeout(this.timer);
    if (this.view.editable && this.candidates().some((candidate) => candidate.status === "queued")) {
      this.timer = setTimeout(() => this.lookup(), DEBOUNCE_MS);
    }
  }

  destroy() {
    this.destroyed = true;
    clearTimeout(this.timer);
  }

  private candidates(): Candidate[] {
    return lookupKey.getState(this.view.state)?.candidates ?? [];
  }

  private lookup() {
    if (this.destroyed || !this.view.editable) return;

    const candidates = this.candidates().filter((candidate) => candidate.status === "queued");
    const urls = [...new Set(candidates.map((candidate) => candidate.url))];
    this.view.dispatch(this.view.state.tr.setMeta(lookupKey, { ids: candidates.map((c) => c.id), status: "pending" }));

    for (let index = 0; index < urls.length; index += BATCH_SIZE) {
      const batch = urls.slice(index, index + BATCH_SIZE);
      const ids = candidates.filter((candidate) => batch.includes(candidate.url)).map((candidate) => candidate.id);
      void this.resolveBatch(batch, ids);
    }
  }

  private async resolveBatch(urls: string[], ids: number[]) {
    let links: { url: string; title: string }[] = [];

    try {
      links = await this.resolve(urls);
    } catch {
      // Failed lookups leave URL labels usable; later reads can resolve them again.
    }

    if (this.destroyed || !this.view.editable) return;

    const titles = new Map(links.map((link) => [link.url, link.title]));
    const candidates = this.candidates().filter((candidate) => ids.includes(candidate.id));
    const tr = this.view.state.tr;

    for (const candidate of candidates.sort((a, b) => b.from - a.from)) {
      const title = titles.get(candidate.url);
      if (title && title !== candidate.node.text) {
        const marks = candidate.node.marks.map((mark) =>
          mark.type.name === "link"
            ? mark.type.create({
                ...mark.attrs,
                operatelyResourceLink: { originalText: candidate.node.text, resolvedText: title },
              })
            : mark,
        );
        tr.replaceWith(candidate.from, candidate.to, tr.doc.type.schema.text(title, marks));
      }
    }

    tr.setMeta(lookupKey, { ids, status: "done" });
    // Give automatic conversion its own undo step. Undo must not immediately resolve the URL again.
    this.view.dispatch(tr.docChanged ? closeHistory(tr) : tr);
  }
}
