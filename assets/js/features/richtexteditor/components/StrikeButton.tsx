import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function StrikeButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleStrike().run()}
      isActive={editor?.isActive("strike")}
      title="Strikethrough"
    >
      <Icons.IconStrikethrough size={iconSize} />
    </ToolbarToggleButton>
  );
}
