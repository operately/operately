import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function BoldButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleBold().run()}
      isActive={editor?.isActive("bold")}
      title="Bold"
    >
      <Icons.IconBold size={iconSize} />
    </ToolbarToggleButton>
  );
}
