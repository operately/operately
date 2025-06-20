import * as React from "react";
import { IconArrowBackUp } from "../../icons";

import { ToolbarButton } from "./ToolbarButton";

export function UndoButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Undo">
      <IconArrowBackUp size={iconSize} />
    </ToolbarButton>
  );
}
