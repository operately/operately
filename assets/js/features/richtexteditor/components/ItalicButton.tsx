import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function ItalicButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleItalic().run()}
      isActive={editor.isActive("italic")}
      title="Italic"
    >
      <Icons.IconItalic size={iconSize} />
    </ToolbarToggleButton>
  );
}
