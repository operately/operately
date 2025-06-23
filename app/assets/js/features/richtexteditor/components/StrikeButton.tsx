import * as React from "react";
import { IconStrikethrough } from "turboui";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function StrikeButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleStrike().run()}
      isActive={editor?.isActive("strike")}
      title="Strikethrough"
    >
      <IconStrikethrough size={iconSize} />
    </ToolbarToggleButton>
  );
}
