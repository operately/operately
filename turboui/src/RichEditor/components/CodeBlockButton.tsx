import * as React from "react";

import { IconCode } from "../../icons";
import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function CodeBlockButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      isActive={editor?.isActive("codeblock")}
      title="Code Block"
    >
      <IconCode size={iconSize - 2} />
    </ToolbarToggleButton>
  );
}
