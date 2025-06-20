import * as React from "react";

import { ToolbarButton } from "./ToolbarButton";
import { IconMinus } from "turboui";

export function DividerButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
      <IconMinus size={iconSize} />
    </ToolbarButton>
  );
}
