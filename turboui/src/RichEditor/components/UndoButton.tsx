import * as React from "react";
import { IconArrowBackUp } from "../../icons";

import { ToolbarButton } from "./ToolbarButton";
import { canExecuteEditorCommand } from "./canExecuteEditorCommand";

export function UndoButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarButton
      onClick={() => editor.chain().focus().undo().run()}
      disabled={!canExecuteEditorCommand(editor, (can) => can.undo())}
      title="Undo"
    >
      <IconArrowBackUp size={iconSize} />
    </ToolbarButton>
  );
}
