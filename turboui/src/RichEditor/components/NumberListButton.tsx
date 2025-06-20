import * as React from "react";
import { IconListNumbers } from "../../icons";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function NumberListButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      isActive={editor?.isActive("orderedList")}
      title="Numbered List"
    >
      <IconListNumbers size={iconSize} />
    </ToolbarToggleButton>
  );
}
