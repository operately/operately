import * as React from "react";

import { IconMinus } from "../../icons";

import { ToolbarButton } from "./ToolbarButton";

export function DividerButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
      <IconMinus size={iconSize} />
    </ToolbarButton>
  );
}
