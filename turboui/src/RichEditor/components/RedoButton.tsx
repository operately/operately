import * as React from "react";
import { IconArrowForwardUp } from "../../icons";

import { ToolbarButton } from "./ToolbarButton";

export function RedoButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Redo">
      <IconArrowForwardUp size={iconSize} />
    </ToolbarButton>
  );
}
