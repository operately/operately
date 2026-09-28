import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import type { Node as DocumentNode } from "@tiptap/pm/model";
import { CellSelection, TableMap } from "@tiptap/pm/tables";

export const insertionActions = [
  { label: "Add row above", command: "addRowBefore" },
  { label: "Add row below", command: "addRowAfter" },
  { label: "Add column left", command: "addColumnBefore" },
  { label: "Add column right", command: "addColumnAfter" },
] as const;
export type TableAction =
  | (typeof insertionActions)[number]["command"]
  | "deleteRow"
  | "deleteColumn"
  | "deleteTable"
  | "toggleHeaderRow";
export type TableTarget = {
  position: number;
  cellPosition: number;
  node: DocumentNode;
  table: HTMLTableElement;
  cell: HTMLTableCellElement;
  slot: HTMLElement;
  row: number;
  column: number;
  rows: number;
  columns: number;
};

/** Resolve the selection's head cell, including rectangular cell selections. */
export function tableTarget(editor: Editor): TableTarget | null {
  if (editor.isDestroyed || !editor.isEditable) return null;

  const { selection, doc } = editor.state;
  const head = selection instanceof CellSelection ? doc.resolve(selection.$headCell.pos + 1) : selection.$head;
  let cellDepth = 0;

  for (let depth = head.depth; depth > 0; depth--) {
    const role = head.node(depth).type.spec.tableRole;
    if (role === "cell" || role === "header_cell") {
      cellDepth = depth;
      break;
    }
  }

  if (!cellDepth) return null;

  const tableDepth = cellDepth - 2;

  if (tableDepth < 1 || head.node(tableDepth).type.name !== "table") return null;

  const position = head.before(tableDepth);
  const node = head.node(tableDepth);
  const cellPosition = head.before(cellDepth);
  const cell = editor.view.nodeDOM(cellPosition);

  if (!(cell instanceof HTMLTableCellElement)) return null;

  const table = cell.closest("table");
  const slot = table?.parentElement?.querySelector<HTMLElement>(":scope > .rich-text-table-settings");

  if (!table || !slot) return null;

  const map = TableMap.get(node);
  const rect = map.findCell(cellPosition - position - 1);

  return {
    position,
    cellPosition,
    node,
    table,
    cell,
    slot,
    row: rect.top,
    column: rect.left,
    rows: map.height,
    columns: map.width,
  };
}

/** Collapse multi-cell selections so an action affects only the cursor's row or column. */
export function runTableAction(editor: Editor, target: TableTarget, action: TableAction): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.state.doc.nodeAt(target.position) !== target.node)
    return false;

  const before = editor.state.doc;
  const selection = editor.state.selection;
  const cursor = selection instanceof CellSelection ? target.cellPosition + 2 : selection.head;
  editor
    .chain()
    .command(({ tr }) => {
      closeHistory(tr);
      return true;
    })
    .setTextSelection(cursor)
    [action]()
    .focus()
    .run();

  if (editor.state.doc === before) return false;

  editor.view.dispatch(closeHistory(editor.state.tr));

  return true;
}

export function canRunTableAction(editor: Editor, target: TableTarget, action: TableAction): boolean {
  if (editor.isDestroyed || !editor.isEditable) return false;

  return editor
    .can()
    .chain()
    .setTextSelection(target.cellPosition + 2)
    [action]()
    .run();
}
