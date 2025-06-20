import * as React from "react";

import { ToolbarButton } from "./ToolbarButton";
import { LucideMinus } from "turboui";

export function DividerButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
      <LucideMinus size={iconSize} />
    </ToolbarButton>
  );
}
