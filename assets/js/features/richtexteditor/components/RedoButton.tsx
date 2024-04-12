import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { ToolbarButton } from "./ToolbarButton";

export function RedoButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
      <Icons.IconArrowForwardUp size={iconSize} />
    </ToolbarButton>
  );
}
