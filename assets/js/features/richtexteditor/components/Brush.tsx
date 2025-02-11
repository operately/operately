import * as React from "react";

import { PaintBucket } from "lucide-react";
import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function Brush({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleColor().run()}
      isActive={editor?.isActive("color")}
      title="Color"
    >
      <PaintBucket size={iconSize} />
    </ToolbarToggleButton>
  );
}
