import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function BlockquoteButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleBlockquote().run()}
      isActive={editor?.isActive("blockquote")}
      title="Quote"
    >
      <Icons.IconBlockquote size={iconSize} />
    </ToolbarToggleButton>
  );
}
