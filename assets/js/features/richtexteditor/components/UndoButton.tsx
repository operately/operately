import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { ToolbarButton } from "./ToolbarButton";

export function UndoButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
      <Icons.IconArrowBackUp size={iconSize} />
    </ToolbarButton>
  );
}
