import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

export function BulletListButton({ editor, iconSize }): JSX.Element {
  return (
    <ToolbarToggleButton
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      isActive={editor?.isActive("bulletList")}
      title="Bullet List"
    >
      <Icons.IconList size={iconSize} />
    </ToolbarToggleButton>
  );
}
