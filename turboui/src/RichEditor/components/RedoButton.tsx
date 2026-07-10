import * as React from "react";
import { IconArrowForwardUp } from "../../icons";

import { ToolbarButton } from "./ToolbarButton";
import { canExecuteEditorCommand } from "./canExecuteEditorCommand";

export function RedoButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarButton
      onClick={() => editor.chain().focus().redo().run()}
      disabled={!canExecuteEditorCommand(editor, (can) => can.redo())}
      title="Redo"
    >
      <IconArrowForwardUp size={iconSize} />
    </ToolbarButton>
  );
}
