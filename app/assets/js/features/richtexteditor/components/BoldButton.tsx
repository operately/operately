import * as React from "react";
import { IconBold } from "turboui";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function BoldButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleBold().run()}
      isActive={editor?.isActive("bold")}
      title="Bold"
    >
      <IconBold size={iconSize} strokeWidth={2.2} />
    </ToolbarToggleButton>
  );
}
