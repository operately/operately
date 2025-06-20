import * as React from "react";
import { IconBlockquote } from "turboui";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function BlockquoteButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleBlockquote().run()}
      isActive={editor?.isActive("blockquote")}
      title="Quote"
    >
      <IconBlockquote size={iconSize} />
    </ToolbarToggleButton>
  );
}
