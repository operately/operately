import { Table, TableCell, TableHeader, TableRow, TableView } from "@tiptap/extension-table";
import { commands, Extension, type Command } from "@tiptap/core";
import { isHistoryTransaction } from "@tiptap/pm/history";
import type { Node, ResolvedPos } from "@tiptap/pm/model";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
import { isInTable, selectedRect } from "@tiptap/pm/tables";
import type { EditorView, ViewMutationRecord } from "@tiptap/pm/view";
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
  private settings: HTMLDivElement;
  constructor(node: Node, cellMinWidth: number, view: EditorView, attributes: Record<string, unknown>) {
    super(node, cellMinWidth, view, attributes);
    // React renders edit-only controls here, outside the document's table content.
    this.settings = document.createElement("div");
    this.settings.className = "rich-text-table-settings";
    this.settings.contentEditable = "false";
    this.settings.style.position = "sticky";
    this.settings.style.left = "0";
    this.dom.prepend(this.settings);
    this.dom.tabIndex = 0;
    this.dom.setAttribute("role", "region");
    this.dom.setAttribute("aria-label", "Table");
  }

  stopEvent(event: Event) {
    return event.target instanceof globalThis.Node && this.settings.contains(event.target);
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    if (this.settings.contains(mutation.target)) return true;
    return super.ignoreMutation(mutation);
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
      addRowBefore: () => withHeaderRow(parent?.addRowBefore?.()),
      addRowAfter: () => withHeaderRow(parent?.addRowAfter?.()),
      addColumnBefore: () => withHeaderRow(parent?.addColumnBefore?.()),
      addColumnAfter: () => withHeaderRow(parent?.addColumnAfter?.()),
      toggleHeaderRow: () => withHeaderRow(parent?.toggleHeaderRow?.(), "toggle"),
      deleteRow: () => (props) => {
        if (!isInTable(props.state)) return false;
        const rect = selectedRect(props.state);
        if (rect.bottom - rect.top === rect.map.height) return props.commands.deleteTable();
        return withHeaderRow(parent?.deleteRow?.())(props);
      },
      deleteColumn: () => (props) => {
        if (!isInTable(props.state)) return false;
        const rect = selectedRect(props.state);
        if (rect.right - rect.left === rect.map.width) return props.commands.deleteTable();
        return withHeaderRow(parent?.deleteColumn?.())(props);
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

export function hasTableHeader(table: Node): boolean {
  const row = table.firstChild;
  return !!row && row.childCount > 0 && row.content.content.every((cell) => cell.type.name === "tableHeader");
}

// Let Tiptap change the grid, then preserve our first-row-only header policy in the same undo step.
function withHeaderRow(command: Command | undefined, mode: "preserve" | "toggle" = "preserve"): Command {
  return (props) => {
    if (!command || !isInTable(props.state)) return false;

    const { table, tableStart } = selectedRect(props.state);

    // Ordinary grid edits must not normalize mixed headers or saved header columns.
    if (mode === "preserve" && !hasStandardHeaderLayout(table)) return command(props);

    const header = hasTableHeader(table);
    const changed = command(props);

    if (changed && props.dispatch) setHeaderRow(props.tr, tableStart - 1, mode === "toggle" ? !header : header);

    return changed;
  };
}

function hasStandardHeaderLayout(table: Node): boolean {
  const header = hasTableHeader(table);
  return table.content.content.every((row, index) =>
    row.content.content.every((cell) => cell.type.name === (header && index === 0 ? "tableHeader" : "tableCell")),
  );
}

function setHeaderRow(transaction: Transaction, position: number, enabled: boolean) {
  const table = transaction.doc.nodeAt(position);

  if (table?.type.name !== "table") return;

  table.forEach((row, rowOffset, rowIndex) => {
    row.forEach((cell, cellOffset) => {
      const type = table.type.schema.nodes[enabled && rowIndex === 0 ? "tableHeader" : "tableCell"];
      if (type && cell.type !== type)
        transaction.setNodeMarkup(position + rowOffset + cellOffset + 2, type, cell.attrs);
    });
  });
}

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
