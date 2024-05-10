import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function NumberListButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      isActive={editor?.isActive("orderedList")}
      title="Numbered List"
    >
      <Icons.IconListNumbers size={iconSize} />
    </ToolbarToggleButton>
  );
}
