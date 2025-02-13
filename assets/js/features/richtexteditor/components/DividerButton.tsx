import * as React from "react";
import { Minus } from "lucide-react";

import { ToolbarButton } from "./ToolbarButton";

export function DividerButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
      <Minus size={iconSize} />
    </ToolbarButton>
  );
}
