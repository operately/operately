import React from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import { IconPlus } from "../../icons";
import { useTipTapEditor } from "../EditorContext";
import { ToolbarButton } from "./ToolbarButton";

type InsertCommand = "addColumnBefore" | "addColumnAfter" | "addRowBefore" | "addRowAfter";
type Boundary = {
  table: HTMLTableElement;
  cell: HTMLTableCellElement;
  command: InsertCommand;
  axis: "row" | "column";
  edge: number;
  x: number;
  y: number;
  start: number;
  end: number;
};

const HOVER_DELAY = 200;
const BORDER_TOLERANCE = 5;

export function TableHoverControls() {
  const editor = useTipTapEditor();
  const button = React.useRef<HTMLButtonElement>(null);
  const boundary = useHoveredBoundary(editor, button);
  if (!boundary || !editor?.isEditable || editor.isDestroyed) return null;

  const insert = () => {
    if (editor.isDestroyed || !editor.isEditable || !editor.view.dom.contains(boundary.cell)) return;
    // Resolve the hovered cell at click time; the text cursor may be in another table.
    const position = editor.view.posAtDOM(boundary.cell, 0) + 1;
    editor
      .chain()
      .command(({ tr }) => {
        closeHistory(tr);
        return true;
      })
      .setTextSelection(position)
      .focus()
      [boundary.command]()
      .run();
  };
  const vertical = boundary.axis === "column";
  const label = vertical ? "Add column" : "Add row";

  // A portal lets edge buttons extend beyond the table's horizontal scroll container.
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <div
        className="rich-text-table-insertion-line absolute bg-brand-1/25"
        style={
          vertical
            ? { left: boundary.edge, top: boundary.start, width: 1, height: boundary.end - boundary.start }
            : { left: boundary.start, top: boundary.edge, width: boundary.end - boundary.start, height: 1 }
        }
      />
      <ToolbarButton
        ref={button}
        title={label}
        aria-label={label}
        tabIndex={0}
        className="pointer-events-auto absolute !rounded-full !p-1 !bg-brand-1 hover:brightness-95 !text-white-1 shadow-sm"
        style={{ left: boundary.x, top: boundary.y, transform: "translate(-50%, -50%)" }}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={insert}
      >
        <IconPlus size={16} />
      </ToolbarButton>
    </div>,
    editor.view.dom.ownerDocument.body,
  );
}

function useHoveredBoundary(editor: Editor, button: React.RefObject<HTMLButtonElement>) {
  const [visible, setVisible] = React.useState<Boundary | null>(null);

  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const doc = editor.view.dom.ownerDocument;
    const win = doc.defaultView;
    let pending: Boundary | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const clear = () => {
      clearTimeout(timer);
      pending = null;
      setVisible(null);
    };
    const move = (event: PointerEvent) => {
      if (button.current?.contains(event.target as Node)) return;
      if (
        editor.isDestroyed ||
        !editor.isEditable ||
        event.buttons ||
        event.pointerType === "touch" ||
        !editor.view.dom.parentElement?.contains(event.target as Node)
      ) {
        clear();
        return;
      }
      const next = findBoundary(editor, event);
      // Keep a nearby button still so it does not chase the pointer when approached.
      if (
        next &&
        pending?.table === next.table &&
        pending.axis === next.axis &&
        pending.edge === next.edge &&
        Math.hypot(pending.x - next.x, pending.y - next.y) <= 24
      )
        return;
      clear();
      if (!next) return;
      pending = next;
      timer = setTimeout(() => setVisible(next), HOVER_DELAY);
    };
    const pointerDown = (event: PointerEvent) => {
      if (!button.current?.contains(event.target as Node)) clear();
    };

    doc.addEventListener("pointermove", move);
    doc.addEventListener("pointerdown", pointerDown, true);
    doc.addEventListener("mouseleave", clear);
    win?.addEventListener("scroll", clear, true);
    win?.addEventListener("resize", clear);
    win?.addEventListener("blur", clear);
    editor.on("transaction", clear);

    return () => {
      clearTimeout(timer);
      doc.removeEventListener("pointermove", move);
      doc.removeEventListener("pointerdown", pointerDown, true);
      doc.removeEventListener("mouseleave", clear);
      win?.removeEventListener("scroll", clear, true);
      win?.removeEventListener("resize", clear);
      win?.removeEventListener("blur", clear);
      editor.off("transaction", clear);
    };
  }, [editor, button]);

  return visible;
}

/** Find the nearest visible cell border, including outside edges and shared borders. */
function findBoundary(editor: Editor, event: PointerEvent): Boundary | null {
  const { clientX: x, clientY: y } = event;
  const hoveredCell = event.target instanceof Element ? event.target.closest<HTMLTableCellElement>("td, th") : null;

  for (const table of editor.view.dom.querySelectorAll("table")) {
    const bounds = table.getBoundingClientRect();
    const clip = table.parentElement?.getBoundingClientRect() ?? bounds;
    const left = Math.max(bounds.left, clip.left);
    const right = Math.min(bounds.right, clip.right);

    if (
      x < left - BORDER_TOLERANCE ||
      x > right + BORDER_TOLERANCE ||
      y < bounds.top - BORDER_TOLERANCE ||
      y > bounds.bottom + BORDER_TOLERANCE
    )
      continue;

    let nearest: Boundary | null = null;
    let distance = BORDER_TOLERANCE + 1;
    // Most moves only need one cell's geometry; scan the grid when approaching an outside edge.
    const cells =
      hoveredCell?.closest("table") === table
        ? [hoveredCell]
        : Array.from(table.rows).flatMap((row) => Array.from(row.cells));

    for (const cell of cells) {
      const rect = cell.getBoundingClientRect();
      const edges = [
        { axis: "column", edge: rect.left, command: "addColumnBefore" },
        { axis: "column", edge: rect.right, command: "addColumnAfter" },
        { axis: "row", edge: rect.top, command: "addRowBefore" },
        { axis: "row", edge: rect.bottom, command: "addRowAfter" },
      ] as const;

      for (const { axis, edge, command } of edges) {
        const vertical = axis === "column";
        const delta = Math.abs((vertical ? x : y) - edge);
        const alongCell = vertical ? y >= rect.top && y <= rect.bottom : x >= rect.left && x <= rect.right;

        if (!alongCell || delta > BORDER_TOLERANCE || delta >= distance || (vertical && (edge < left || edge > right)))
          continue;
        distance = delta;
        nearest = {
          table,
          cell,
          axis,
          edge,
          command,
          x: vertical ? edge : x,
          y: vertical ? y : edge,
          start: vertical ? bounds.top : left,
          end: vertical ? bounds.bottom : right,
        };
      }
    }

    return nearest;
  }

  return null;
}
