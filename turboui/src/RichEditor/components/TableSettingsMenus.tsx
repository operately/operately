import React from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import { closeHistory } from "@tiptap/pm/history";
import { IconSettings } from "../../icons";
import { Menu, MenuActionItem, MenuSeparator } from "../../Menu";
import { useTipTapEditor } from "../EditorContext";
import { hasTableHeader } from "../extensions/Table";
import { ToolbarButton } from "./ToolbarButton";

type TableTarget = { position: number; slot: HTMLElement; table: HTMLTableElement; hasHeader: boolean };

export function TableSettingsMenus() {
  const editor = useTipTapEditor();
  const [tables, setTables] = React.useState<TableTarget[]>([]);

  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const update = () => {
      const targets: TableTarget[] = [];

      if (!editor.isDestroyed && editor.isEditable) {
        editor.state.doc.descendants((node, position) => {
          if (node.type.name !== "table") return;
          const dom = editor.view.nodeDOM(position);
          if (!(dom instanceof HTMLElement)) return false;
          const slot = dom.querySelector<HTMLElement>(".rich-text-table-settings");
          const table = dom.querySelector<HTMLTableElement>("table");
          if (slot && table) targets.push({ position, slot, table, hasHeader: hasTableHeader(node) });
          return false;
        });
      }

      setTables(targets);
    };

    // Transactions also cover content loads that intentionally suppress update events.
    const onTransaction = ({ transaction }: { transaction: Transaction }) => {
      if (transaction.docChanged) update();
    };

    let editable = editor.isEditable;
    const onUpdate = () => {
      if (editable === editor.isEditable) return;
      editable = editor.isEditable;
      update();
    };
    update();
    editor.on("transaction", onTransaction);
    editor.on("update", onUpdate);

    return () => {
      editor.off("transaction", onTransaction);
      editor.off("update", onUpdate);
    };
  }, [editor]);

  return (
    <>
      {tables.map((target) =>
        createPortal(<TableSettingsMenu editor={editor} target={target} />, target.slot, String(target.position)),
      )}
    </>
  );
}

function TableSettingsMenu({ editor, target }: { editor: Editor; target: TableTarget }) {
  const executed = React.useRef(false);
  const run = (command: "toggleHeaderRow" | "deleteTable") => {
    const cell = target.table.querySelector("th, td");
    if (!cell || editor.isDestroyed || !editor.isEditable || !editor.view.dom.contains(cell)) return;
    executed.current = true;
    // Resolve the owning table now: the text cursor may be in a different table.
    editor
      .chain()
      .command(({ tr }) => {
        closeHistory(tr);
        return true;
      })
      .setTextSelection(editor.view.posAtDOM(cell, 0) + 1)
      .focus()
      [command]()
      .run();
    editor.view.dispatch(closeHistory(editor.state.tr));
  };

  return (
    <div className="flex justify-end pb-1">
      <Menu
        size="tiny"
        align="end"
        customTrigger={
          <ToolbarButton
            title="Table settings"
            aria-label="Table settings"
            tabIndex={0}
            className="!text-content-dimmed"
          >
            <IconSettings size={16} />
          </ToolbarButton>
        }
        onOpenChange={(open) => {
          if (open) executed.current = false;
        }}
        onCloseAutoFocus={(event) => {
          if (executed.current) {
            event.preventDefault();
            if (!editor.isDestroyed) editor.commands.focus();
          }
        }}
      >
        <MenuActionItem testId="table-toggleHeaderRow" onClick={() => run("toggleHeaderRow")}>
          {target.hasHeader ? "Remove header row" : "Add header row"}
        </MenuActionItem>
        <MenuSeparator />
        <MenuActionItem danger testId="table-deleteTable" onClick={() => run("deleteTable")}>
          Delete table
        </MenuActionItem>
      </Menu>
    </div>
  );
}
