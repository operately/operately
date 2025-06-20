import * as React from "react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";
import { IconCode } from "turboui";

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
