import * as React from "react";
import { IconList } from "turboui";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function BulletListButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      isActive={editor?.isActive("bulletList")}
      title="Bullet List"
    >
      <IconList size={iconSize} />
    </ToolbarToggleButton>
  );
}
