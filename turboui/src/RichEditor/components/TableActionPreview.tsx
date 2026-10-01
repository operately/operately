import { useEmbedding, portalPosition } from "../../Embedding";
import React from "react";
import { createPortal } from "react-dom";
import { TableMap } from "@tiptap/pm/tables";
import type { TableAction, TableTarget } from "./tableActions";

type Rect = { left: number; top: number; width: number; height: number };

export function TableActionPreview({ target, action }: { target: TableTarget; action: TableAction | null }) {
  const embedding = useEmbedding();
  const [rect, setRect] = React.useState<Rect | null>(null);
  React.useLayoutEffect(() => {
    const update = () => setRect(action ? previewRect(target, action) : null);
    const win = target.table.ownerDocument.defaultView;
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(target.table);
    update();
    win?.addEventListener("scroll", update, true);
    win?.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      win?.removeEventListener("scroll", update, true);
      win?.removeEventListener("resize", update);
    };
  }, [target, action]);
  if (!rect || !action) return null;
  return createPortal(
    <div
      aria-hidden="true"
      data-test-id="table-action-preview"
      data-action={action}
      className={`pointer-events-none z-[99] ${action.startsWith("delete") ? "bg-content-error opacity-10" : "bg-brand-1/25"}`}
      style={portalPosition(rect, embedding?.portalContainer)}
    />,
    embedding?.portalContainer ?? target.table.ownerDocument.body,
  );
}

function previewRect(target: TableTarget, action: TableAction): Rect | null {
  if (!target.table.isConnected || action === "toggleHeaderRow") return null;
  const table = target.table.getBoundingClientRect();
  const cell = target.cell.getBoundingClientRect();
  const row = target.cell.parentElement?.getBoundingClientRect() ?? cell;
  const clip = target.table.parentElement?.getBoundingClientRect() ?? table;
  const win = target.table.ownerDocument.defaultView;
  let left = table.left,
    right = table.right,
    top = table.top,
    bottom = table.bottom;
  switch (action) {
    case "addRowBefore":
      top = row.top - 1;
      bottom = row.top + 1;
      break;
    case "addRowAfter":
      top = cell.bottom - 1;
      bottom = cell.bottom + 1;
      break;
    case "addColumnBefore":
      left = cell.left - 1;
      right = cell.left + 1;
      break;
    case "addColumnAfter":
      left = cell.right - 1;
      right = cell.right + 1;
      break;
    case "deleteRow":
      {
        // Tiptap deletes the full table-map range of a row-spanning cell.
        const range = TableMap.get(target.node).findCell(target.cellPosition - target.position - 1);
        if (range.bottom - range.top < target.rows) {
          top = target.table.rows[range.top]?.getBoundingClientRect().top ?? cell.top;
          bottom = target.table.rows[range.bottom - 1]?.getBoundingClientRect().bottom ?? cell.bottom;
        }
      }
      break;
    case "deleteColumn":
      if (target.columns > 1) {
        left = cell.left;
        right = cell.right;
      }
      break;
  }
  left = Math.max(left, clip.left, 0);
  right = Math.min(right, clip.right, win?.innerWidth ?? right);
  top = Math.max(top, clip.top, 0);
  bottom = Math.min(bottom, clip.bottom, win?.innerHeight ?? bottom);
  return right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null;
}
