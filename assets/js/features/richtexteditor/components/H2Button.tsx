import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function H2Button({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      isActive={editor?.isActive("heading", { level: 2 })}
      title="Heading 2"
    >
      <Icons.IconH2 size={iconSize} />
    </ToolbarToggleButton>
  );
}
