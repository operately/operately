import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { MenuToggleButton } from "./MenuToggleButton";

export function BulletListButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuToggleButton
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      isActive={editor.isActive("bulletList")}
      title="Bullet List"
    >
      <Icons.IconList size={iconSize} />
    </MenuToggleButton>
  );
}
