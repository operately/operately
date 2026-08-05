import * as React from "react";

import { IconTable } from "../../icons";

import { ToolbarButton } from "./ToolbarButton";

export function TableButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarButton
      onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      title="Table"
    >
      <IconTable size={iconSize} />
    </ToolbarButton>
  );
}
