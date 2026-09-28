import React from "react";
import type { Command, Editor } from "@tiptap/core";
import { createTable } from "@tiptap/extension-table";
import { closeHistory } from "@tiptap/pm/history";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { IconTable } from "../../icons";
import { ToolbarButton } from "./ToolbarButton";
import { canExecuteEditorCommand } from "./canExecuteEditorCommand";

export function TableButton({ editor, iconSize }: { editor: Editor | null; iconSize: number }) {
  if (!editor || editor.isDestroyed || !editor.isEditable) return null;

  return (
    <ToolbarButton
      title="Table"
      tabIndex={0}
      aria-label="Table"
      disabled={!canExecuteEditorCommand(editor, (can) => can.command(insertTableFromToolbar))}
      onClick={() => {
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            closeHistory(tr);
            return true;
          })
          .command(insertTableFromToolbar)
          .run();
        editor.view.dispatch(closeHistory(editor.state.tr));
      }}
    >
      <IconTable size={iconSize} />
    </ToolbarButton>
  );
}

/** Inside a table, insert a sibling after it instead of nesting or replacing it. */
const insertTableFromToolbar: Command = ({ state, tr, dispatch, commands }) => {
  const { selection } = state;
  let after: number | null = null;

  for (let depth = 1; depth <= selection.$from.depth; depth++) {
    if (selection.$from.node(depth).type.name === "table") {
      after = selection.$from.after(depth);
      break;
    }
  }

  if (selection instanceof NodeSelection && selection.node.type.name === "table") after = selection.to;
  if (after === null) return commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });

  const table = createTable(state.schema, 3, 3, true);
  const position = tr.doc.resolve(after);

  if (!position.parent.canReplaceWith(position.index(), position.index(), table.type)) return false;
  if (dispatch) {
    tr.insert(after, table)
      .setSelection(TextSelection.near(tr.doc.resolve(after + 1)))
      .scrollIntoView();
  }

  return true;
};
