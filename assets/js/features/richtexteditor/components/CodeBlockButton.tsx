import * as React from "react";
import { Code } from "lucide-react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function CodeBlockButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      isActive={editor?.isActive("codeblock")}
      title="Code Block"
    >
      <Code size={iconSize - 2} />
    </ToolbarToggleButton>
  );
}
