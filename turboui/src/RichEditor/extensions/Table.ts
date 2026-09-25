import { Table, TableCell, TableHeader, TableRow, TableView } from "@tiptap/extension-table";
import { commands, Extension } from "@tiptap/core";
import { isHistoryTransaction } from "@tiptap/pm/history";
import type { Node, ResolvedPos } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { normalizeTableHtml } from "../tablePaste";

const contentLoad = new PluginKey("tableContentLoad");

export function isInsideTable(position: ResolvedPos): boolean {
  for (let depth = position.depth; depth > 0; depth--) {
    if (position.node(depth).type.name === "table") return true;
  }
  return false;
}

const TablePaste = Extension.create({
  name: "tablePaste",
  // Run before image stripping without changing the schema's default block type.
  priority: 1100,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          transformPastedHTML: (html) => normalizeTableHtml(html, isInsideTable(this.editor.state.selection.$from)),
        },
      }),
    ];
  },
});

class ScrollableTableView extends TableView {
  constructor(node: Node, cellMinWidth: number, view: EditorView, attributes: Record<string, unknown>) {
    super(node, cellMinWidth, view, attributes);
    this.dom.tabIndex = 0;
    this.dom.setAttribute("role", "region");
    this.dom.setAttribute("aria-label", "Table");
  }
}

const TableExtension = Table.extend({
  addKeyboardShortcuts() {
    return Object.fromEntries(
      Object.entries(this.parent?.() ?? {}).map(([key, command]) => [
        key,
        () => this.editor.isEditable && command({ editor: this.editor }),
      ]),
    );
  },
  addCommands() {
    const parent = this.parent?.();
    return {
      ...parent,
      setContent: (content, options) => (props) => {
        // Whole-document loads preserve stored content, including legacy table features.
        props.tr.setMeta(contentLoad, true);
        return commands.setContent(content, options)(props);
      },
      insertTable: (options) => (props) => {
        if (isInsideTable(props.state.selection.$from)) return false;
        return parent?.insertTable?.(options)(props) ?? false;
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction: (transaction, state) => {
          if (!transaction.docChanged || transaction.getMeta(contentLoad) || isHistoryTransaction(transaction))
            return true;

          // Text edits may retain legacy features; only new occurrences are rejected.
          const previous = unsupportedTableFeatures(state.doc);
          for (const [feature, count] of unsupportedTableFeatures(transaction.doc)) {
            if (count > (previous.get(feature) ?? 0)) return false;
          }
          return true;
        },
      }),
      ...(this.parent?.() ?? []),
    ];
  },
}).configure({ resizable: false, renderWrapper: true, View: ScrollableTableView, cellMinWidth: 120 });

function unsupportedTableFeatures(doc: Node): Map<string, number> {
  const features = new Map<string, number>();
  const add = (feature: string) => features.set(feature, (features.get(feature) ?? 0) + 1);

  doc.descendants((node, position) => {
    if (["tableCell", "tableHeader"].includes(node.type.name)) {
      const { colspan, rowspan, colwidth } = node.attrs;
      if (colspan !== 1 || rowspan !== 1 || colwidth != null) add(JSON.stringify({ colspan, rowspan, colwidth }));
    } else if (["table", "blob"].includes(node.type.name) && isInsideTable(doc.resolve(position))) {
      add(node.type.name === "blob" ? JSON.stringify(node.toJSON()) : "nestedTable");
    }
  });
  return features;
}

// Keep standard node names and attributes; cell blocks are restricted to paragraphs.
const cellAttributes = () => ({ colspan: { default: 1 }, rowspan: { default: 1 }, colwidth: { default: null } });
export const tableExtensions = [
  TablePaste,
  TableExtension,
  TableRow,
  TableCell.extend({ content: "paragraph+", addAttributes: cellAttributes }),
  TableHeader.extend({ content: "paragraph+", addAttributes: cellAttributes }).configure({
    HTMLAttributes: { scope: "col" },
  }),
];
