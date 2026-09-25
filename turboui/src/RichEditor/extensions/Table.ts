import { Table, TableCell, TableHeader, TableRow, TableView } from "@tiptap/extension-table";
import { Extension } from "@tiptap/core";
import type { Node, ResolvedPos } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { normalizeTableHtml } from "../tablePaste";

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
          if (!transaction.docChanged) return true;
          let valid = true;
          transaction.doc.descendants((node) => {
            if (node.type.name !== "table") return;
            // Reject unsupported inserts/drops without blocking edits outside an untouched legacy table.
            if (!supportedTable(node) && !containsIdenticalTable(state.doc, node)) valid = false;
            return false;
          });
          return valid;
        },
      }),
      ...(this.parent?.() ?? []),
    ];
  },
}).configure({ resizable: false, renderWrapper: true, View: ScrollableTableView, cellMinWidth: 120 });

function supportedTable(table: Node): boolean {
  let valid = true;
  table.descendants((node) => {
    if (["table", "blob"].includes(node.type.name)) valid = false;
    if (["tableCell", "tableHeader"].includes(node.type.name)) {
      if (node.attrs.colspan !== 1 || node.attrs.rowspan !== 1 || node.attrs.colwidth != null) valid = false;
    }
  });
  return valid;
}

function containsIdenticalTable(doc: Node, table: Node): boolean {
  let found = false;
  doc.descendants((node) => {
    if (node.type.name !== "table") return;
    if (node.eq(table)) found = true;
    return false;
  });
  return found;
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
