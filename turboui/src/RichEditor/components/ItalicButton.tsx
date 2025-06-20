import * as React from "react";
import { IconItalic } from "../../icons";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function ItalicButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleItalic().run()}
      isActive={editor?.isActive("italic")}
      title="Italic"
    >
      <IconItalic size={iconSize} />
    </ToolbarToggleButton>
  );
}
