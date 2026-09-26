import React from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import type { Node as DocumentNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { closeHistory } from "@tiptap/pm/history";
import { IconDots } from "../../icons";
import { dismissToast, showInfoToast } from "../../Toasts";
import { useTipTapEditor } from "../EditorContext";
import { ToolbarButton } from "./ToolbarButton";
import { Menu, MenuActionItem, MenuSeparator } from "../../Menu";

type Axis = "row" | "column";
const insertionActions = {
  row: [
    { label: "Add row above", command: "addRowBefore" },
    { label: "Add row below", command: "addRowAfter" },
  ],
  column: [
    { label: "Add column before", command: "addColumnBefore" },
    { label: "Add column after", command: "addColumnAfter" },
  ],
} as const;
type TableCommand = (typeof insertionActions)[Axis][number]["command"] | "deleteRow" | "deleteColumn";
type Target = {
  cell: HTMLTableCellElement;
  table: HTMLTableElement;
  x: number;
  y: number;
  preview: { left: number; top: number; width: number; height: number };
};

const HOVER_DELAY = 500;
const EDGE_DISTANCE = 24;

export function TableAxisMenus() {
  const editor = useTipTapEditor();
  const remove = useTableDeletion(editor);
  return (
    <>
      <AxisMenu editor={editor} axis="row" remove={remove} />
      <AxisMenu editor={editor} axis="column" remove={remove} />
    </>
  );
}

function AxisMenu({
  editor,
  axis,
  remove,
}: {
  editor: Editor;
  axis: Axis;
  remove: (target: Target, axis: Axis) => void;
}) {
  const button = React.useRef<HTMLButtonElement>(null);
  const { target, menuOpen } = useMenuTarget(editor, axis, button);
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const executed = React.useRef(false);

  React.useEffect(() => {
    setOpen(false);
    setHovered(false);
    setFocused(false);
  }, [target]);
  if (!target || !editor?.isEditable || editor.isDestroyed) return null;
  const label = axis === "row" ? "Row actions" : "Column actions";

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {open && (
        <div
          data-test-id={`table-menu-preview-${axis}`}
          className="absolute bg-brand-1/10 ring-1 ring-inset ring-brand-1/20"
          style={target.preview}
        />
      )}
      <Menu
        size="tiny"
        align="start"
        onOpenChange={(isOpen) => {
          menuOpen.current = isOpen;
          setOpen(isOpen);
          if (isOpen) executed.current = false;
        }}
        onCloseAutoFocus={(event) => {
          if (executed.current || !button.current) {
            event.preventDefault();
            if (!editor.isDestroyed) editor.commands.focus();
          }
        }}
        customTrigger={
          <ToolbarButton
            ref={button}
            title={label}
            aria-label={label}
            tabIndex={0}
            className="pointer-events-auto absolute !p-1 !text-content-dimmed bg-surface-base motion-safe:transition-opacity duration-150"
            style={{
              left: target.x,
              top: target.y,
              transform: "translate(-50%, -50%)",
              opacity: open || hovered || focused ? 1 : 0.4,
            }}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          >
            <IconDots size={16} />
          </ToolbarButton>
        }
      >
        {insertionActions[axis].map(({ label, command }) => (
          <MenuActionItem
            key={command}
            testId={`table-${command}`}
            onClick={() => {
              executed.current = true;
              runTargetCommand(editor, target, command);
            }}
          >
            {label}
          </MenuActionItem>
        ))}
        <MenuSeparator />
        <MenuActionItem
          danger
          testId={`table-menu-delete-${axis}`}
          onClick={() => {
            executed.current = true;
            remove(target, axis);
          }}
        >
          {axis === "row" ? "Delete row" : "Delete column"}
        </MenuActionItem>
      </Menu>
    </div>,
    editor.view.dom.ownerDocument.body,
  );
}

function useTableDeletion(editor: Editor) {
  const undo = React.useRef<{ id: string; doc: DocumentNode } | null>(null);
  const dismiss = React.useCallback(() => {
    if (undo.current) dismissToast(undo.current.id);
    undo.current = null;
  }, []);

  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    // A toast must never undo typing, another command, or a newly loaded document.
    const invalidate = () => {
      if (undo.current && (!editor.isEditable || editor.state.doc !== undo.current.doc)) dismiss();
    };
    editor.on("transaction", invalidate);
    editor.on("destroy", dismiss);
    return () => {
      dismiss();
      editor.off("transaction", invalidate);
      editor.off("destroy", dismiss);
    };
  }, [editor, dismiss]);

  return (target: Target, axis: Axis) => {
    const command = axis === "row" ? "deleteRow" : "deleteColumn";
    if (!runTargetCommand(editor, target, command)) return;
    dismiss();
    const doc = editor.state.doc;
    const id = showInfoToast(axis === "row" ? "Row deleted" : "Column deleted", "", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          dismiss();
          if (!editor.isDestroyed && editor.isEditable && editor.state.doc === doc) editor.chain().focus().undo().run();
        },
      },
    });
    undo.current = { id, doc };
  };
}

/** Apply the action to the menu's cell, independently of the current text selection. */
function runTargetCommand(editor: Editor, target: Target, command: TableCommand) {
  if (editor.isDestroyed || !editor.isEditable || !editor.view.dom.contains(target.cell)) return false;
  const before = editor.state.doc;
  const position = editor.view.posAtDOM(target.cell, 0) + 1;
  editor
    .chain()
    .command(({ tr }) => {
      closeHistory(tr);
      return true;
    })
    .setTextSelection(position)
    .focus()
    [command]()
    .run();
  if (editor.state.doc === before) return false;
  // Keep subsequent typing separate from this action in native undo history.
  editor.view.dispatch(closeHistory(editor.state.tr));
  return true;
}

/** Freeze the target while its menu is open, even when the pointer moves over other cells. */
function useMenuTarget(editor: Editor, axis: Axis, button: React.RefObject<HTMLButtonElement>) {
  const [target, setTarget] = React.useState<Target | null>(null);
  const menuOpen = React.useRef(false);

  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const doc = editor.view.dom.ownerDocument;
    const win = doc.defaultView;
    let pending: Target | null = null;
    let showTimer: ReturnType<typeof setTimeout> | undefined;

    const clear = () => {
      clearTimeout(showTimer);
      pending = null;
      menuOpen.current = false;
      setTarget(null);
    };
    const move = (event: PointerEvent) => {
      if (menuOpen.current || button.current?.contains(event.target as Node) || doc.activeElement === button.current)
        return;
      if (editor.isDestroyed || !editor.isEditable || event.buttons || event.pointerType === "touch") {
        clear();
        return;
      }
      // The margin between the edge and the handle stays interactive on the approach.
      if (pending && nearMenuEdge(pending, axis, event)) return;
      const cell = event.target instanceof Element ? event.target.closest<HTMLTableCellElement>("td, th") : null;
      const next = cell && editor.view.dom.contains(cell) ? menuTarget(cell, axis) : null;
      clear();
      if (!next || !nearMenuEdge(next, axis, event)) return;
      pending = next;
      showTimer = setTimeout(() => setTarget(next), HOVER_DELAY);
    };
    const pointerDown = (event: PointerEvent) => {
      if (!menuOpen.current && !button.current?.contains(event.target as Node)) clear();
    };
    const keyDown = (event: KeyboardEvent) => {
      if (editor.view.dom.contains(event.target as Node)) clear();
    };
    const leave = () => {
      if (!menuOpen.current && doc.activeElement !== button.current) clear();
    };
    const transaction = ({ transaction }: { transaction: Transaction }) => {
      // Focus changes are harmless; document/selection changes invalidate the stored target.
      if (transaction.docChanged || transaction.selectionSet || !editor.isEditable) clear();
    };
    doc.addEventListener("pointermove", move);
    doc.addEventListener("pointerdown", pointerDown, true);
    doc.addEventListener("keydown", keyDown);
    doc.addEventListener("mouseleave", leave);
    win?.addEventListener("scroll", clear, true);
    win?.addEventListener("resize", clear);
    win?.addEventListener("blur", clear);
    editor.on("transaction", transaction);

    return () => {
      clearTimeout(showTimer);
      menuOpen.current = false;
      doc.removeEventListener("pointermove", move);
      doc.removeEventListener("pointerdown", pointerDown, true);
      doc.removeEventListener("keydown", keyDown);
      doc.removeEventListener("mouseleave", leave);
      win?.removeEventListener("scroll", clear, true);
      win?.removeEventListener("resize", clear);
      win?.removeEventListener("blur", clear);
      editor.off("transaction", transaction);
    };
  }, [editor, axis, button]);

  return { target, menuOpen };
}

function nearMenuEdge(target: Target, axis: Axis, event: PointerEvent) {
  const { left, top, width, height } = target.preview;

  return axis === "row"
    ? event.clientX >= target.x - 12 &&
        event.clientX <= left + EDGE_DISTANCE &&
        event.clientY >= top &&
        event.clientY <= top + height
    : event.clientY >= target.y - 12 &&
        event.clientY <= top + EDGE_DISTANCE &&
        event.clientX >= left &&
        event.clientX <= left + width;
}

function menuTarget(cell: HTMLTableCellElement, axis: Axis): Target | null {
  const table = cell.closest("table");
  const row = cell.parentElement;

  if (!table || !row) return null;

  const bounds = table.getBoundingClientRect();
  const clip = table.parentElement?.getBoundingClientRect() ?? bounds;
  const cellBounds = cell.getBoundingClientRect();
  const rowBounds = row.getBoundingClientRect();
  const win = cell.ownerDocument.defaultView;

  if (!win) return null;

  const x = axis === "row" ? bounds.left - 14 : (cellBounds.left + cellBounds.right) / 2;
  const y = axis === "row" ? (rowBounds.top + rowBounds.bottom) / 2 : bounds.top - 14;

  // Do not place an edge menu at a misleading clipped edge.
  if (x - 12 < 0 || x + 12 > win.innerWidth || y - 12 < 0 || y + 12 > win.innerHeight) return null;
  if (axis === "row" && bounds.left < clip.left - 1) return null;
  if (axis === "column" && (cellBounds.left < clip.left || cellBounds.right > clip.right)) return null;

  const left = Math.max(axis === "row" ? bounds.left : cellBounds.left, clip.left, 0);
  const right = Math.min(axis === "row" ? bounds.right : cellBounds.right, clip.right, win.innerWidth);
  const top = Math.max(axis === "row" ? rowBounds.top : bounds.top, 0);
  const bottom = Math.min(axis === "row" ? rowBounds.bottom : bounds.bottom, win.innerHeight);

  return {
    cell,
    table,
    x,
    y,
    preview: { left, top, width: right - left, height: bottom - top },
  };
}
