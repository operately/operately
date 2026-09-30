import { activeElement } from "../../Embedding";
import React from "react";
import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import type { Node as DocumentNode } from "@tiptap/pm/model";
import { dismissToast, showInfoToast } from "../../Toasts";
import { tableTarget, runTableAction, type TableAction, type TableTarget } from "./tableActions";
import { bindTableKeyboard } from "./tableKeyboard";

type OpenMenu = { kind: "settings" } | { kind: "context"; x: number; y: number } | null;

export function useTableControls(editor: Editor) {
  const owner = React.useId();
  const [menu, setMenu] = React.useState<OpenMenu>(null);
  const [preview, setPreview] = React.useState<TableAction | null>(null);
  const closeMenu = React.useCallback(() => {
    setMenu(null);
    setPreview(null);
  }, []);

  const target = useActiveTable(editor, owner, closeMenu);
  const toolbar = useTableMenuTriggers(editor, setMenu);
  const showDeletionUndo = useTableDeletionUndo(editor);

  const run = (action: TableAction) => {
    closeMenu();
    if (target && runTableAction(editor, target, action)) showDeletionUndo(action);
  };

  return { owner, target, toolbar, menu, setMenu, closeMenu, preview, setPreview, run };
}

/** Keeps controls active while focus belongs to the editor or its portalled controls. */
function useActiveTable(editor: Editor, owner: string, closeMenu: () => void) {
  const [target, setTarget] = React.useState<TableTarget | null>(null);

  React.useEffect(() => {
    if (editor.isDestroyed) return;
    const dom = editor.view.dom;
    const doc = dom.ownerDocument;

    const ownsFocus = (element: EventTarget | null) =>
      element instanceof Element &&
      (dom.contains(element) ||
        element.closest("[data-table-controls]")?.getAttribute("data-table-controls") === owner);
    const refresh = () =>
      setTarget(ownsFocus(activeElement(dom.getRootNode() as Document | ShadowRoot)) ? tableTarget(editor) : null);
    const hideControls = () => {
      closeMenu();
      setTarget(null);
    };

    let previousSelection = editor.state.selection;

    const onTransaction = ({ transaction }: { transaction: Transaction }) => {
      const selectionChanged = !previousSelection.eq(editor.state.selection);
      previousSelection = editor.state.selection;
      if (transaction.docChanged || selectionChanged || !editor.isEditable) closeMenu();
      refresh();
    };
    const onFocus = (event: FocusEvent) => {
      // Look inside Shadow DOM so editor focus isn't mistaken for focus outside it.
      if (ownsFocus(event.composedPath()[0] ?? event.target)) refresh();
      else hideControls();
    };
    const onPointerDown = (event: PointerEvent) => {
      // Shadow DOM retargets event.target to its host; check the actual clicked element.
      if (!ownsFocus(event.composedPath()[0] ?? event.target)) hideControls();
    };

    refresh();
    doc.addEventListener("focusin", onFocus);
    doc.addEventListener("pointerdown", onPointerDown, true);
    doc.defaultView?.addEventListener("blur", hideControls);
    editor.on("transaction", onTransaction);
    editor.on("focus", refresh);
    editor.on("update", refresh);
    editor.on("destroy", hideControls);

    return () => {
      doc.removeEventListener("focusin", onFocus);
      doc.removeEventListener("pointerdown", onPointerDown, true);
      doc.defaultView?.removeEventListener("blur", hideControls);
      editor.off("transaction", onTransaction);
      editor.off("focus", refresh);
      editor.off("update", refresh);
      editor.off("destroy", hideControls);
    };
  }, [editor, owner, closeMenu]);

  return target;
}

/** Opens cell menus and gives keyboard users access to the toolbar. */
function useTableMenuTriggers(editor: Editor, setMenu: (menu: OpenMenu) => void) {
  const toolbar = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (editor.isDestroyed) return;
    const dom = editor.view.dom;
    const onContextMenu = (event: MouseEvent) => {
      if (!editor.isEditable || !(event.target instanceof Element)) return;
      const cell = event.target.closest<HTMLTableCellElement>("td, th");
      if (!cell || !dom.contains(cell)) return;
      event.preventDefault();
      // A context-click explicitly changes the target, unlike hovering a control.
      editor.commands.setTextSelection(contextMenuPosition(editor, cell, event));
      editor.view.focus();
      setMenu({ kind: "context", x: event.clientX, y: event.clientY });
    };
    const unbindKeyboard = bindTableKeyboard(dom, (event, hotkey) => {
      const target = tableTarget(editor);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      if (hotkey.shortcut === "alt+f10") {
        toolbar.current?.querySelector<HTMLButtonElement>("button")?.focus();
      } else {
        const rect = target.cell.getBoundingClientRect();
        setMenu({ kind: "context", x: rect.left, y: rect.bottom });
      }
    });

    dom.addEventListener("contextmenu", onContextMenu);
    return () => {
      unbindKeyboard();
      dom.removeEventListener("contextmenu", onContextMenu);
    };
  }, [editor, setMenu]);

  return toolbar;
}

function contextMenuPosition(editor: Editor, cell: HTMLTableCellElement, event: MouseEvent) {
  const coords = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
  const start = editor.view.posAtDOM(cell, 0) + 1;
  const end = start + (editor.state.doc.nodeAt(start - 2)?.content.size ?? 0);
  return coords && coords.pos >= start && coords.pos < end ? coords.pos : start;
}

/** Offers Undo only while it still refers to the deletion that produced the toast. */
function useTableDeletionUndo(editor: Editor) {
  const undo = React.useRef<{ id: string; doc: DocumentNode } | null>(null);
  const dismissUndo = React.useCallback(() => {
    if (undo.current) dismissToast(undo.current.id);
    undo.current = null;
  }, []);

  React.useEffect(() => {
    if (editor.isDestroyed) return;
    const dismissStaleUndo = () => {
      if (undo.current && (!editor.isEditable || editor.state.doc !== undo.current.doc)) dismissUndo();
    };
    editor.on("transaction", dismissStaleUndo);
    editor.on("destroy", dismissUndo);
    return () => {
      dismissUndo();
      editor.off("transaction", dismissStaleUndo);
      editor.off("destroy", dismissUndo);
    };
  }, [editor, dismissUndo]);

  return (action: TableAction) => {
    dismissUndo();
    if (action !== "deleteRow" && action !== "deleteColumn") return;
    const doc = editor.state.doc;
    const id = showInfoToast(action === "deleteRow" ? "Row deleted" : "Column deleted", "", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          dismissUndo();
          if (!editor.isDestroyed && editor.isEditable && editor.state.doc === doc) editor.chain().focus().undo().run();
        },
      },
    });
    undo.current = { id, doc };
  };
}
