import * as React from "react";
import { IconH1 } from "../../icons";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function H1Button({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      isActive={editor?.isActive("heading", { level: 1 })}
      title="Heading 1"
    >
      <IconH1 size={iconSize} />
    </ToolbarToggleButton>
  );
}
